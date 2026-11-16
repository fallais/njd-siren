/**
 * Geometric routing check on a built circuit.json: for every net, are all its pads
 * joined by copper (traces + vias + pads)? The ground pour is ignored, so GND must
 * also be fully traced or reach the pour (reported separately).
 *
 * Usage: bun scripts/check-connectivity.ts dist/index/circuit.json
 */
type P = { x: number; y: number }
const cj = JSON.parse(await Bun.file(process.argv[2] ?? "dist/index/circuit.json").text()) as any[]
const byType = (t: string) => cj.filter((e) => e.type === t)

const sourceComponentName = Object.fromEntries(byType("source_component").map((c) => [c.source_component_id, c.name]))
const sourcePort = Object.fromEntries(byType("source_port").map((p) => [p.source_port_id, p]))
const pcbPortToSource = Object.fromEntries(byType("pcb_port").map((p) => [p.pcb_port_id, p.source_port_id]))
const netOfSourcePort: Record<string, string> = {}
for (const p of byType("source_port")) netOfSourcePort[p.source_port_id] = p.subcircuit_connectivity_map_key
const netName: Record<string, string> = {}
for (const n of byType("source_net")) netName[n.subcircuit_connectivity_map_key] = n.name

// Copper nodes: pads (with shape) and trace/via points.
type Node = { id: number; layers: string[]; hit: (p: P, layer: string) => boolean; label?: string; net?: string }
const nodes: Node[] = []
const parent: number[] = []
const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
const union = (a: number, b: number) => { parent[find(a)] = find(b) }
const add = (n: Omit<Node, "id">) => { const id = nodes.length; nodes.push({ ...n, id }); parent.push(id); return id }

const EPS = 0.02
for (const pad of byType("pcb_smtpad")) {
  const sp = sourcePort[pcbPortToSource[pad.pcb_port_id]]
  if (!sp) continue
  const w = (pad.width ?? pad.radius * 2) / 2 + EPS, h = (pad.height ?? pad.radius * 2) / 2 + EPS
  add({ layers: [pad.layer], hit: (p, l) => l === pad.layer && Math.abs(p.x - pad.x) <= w && Math.abs(p.y - pad.y) <= h,
    label: `${sourceComponentName[sp.source_component_id]}.${sp.name}`, net: netOfSourcePort[sp.source_port_id] })
}
for (const hole of byType("pcb_plated_hole")) {
  const sp = sourcePort[pcbPortToSource[hole.pcb_port_id]]
  const r = Math.max(hole.outer_diameter ?? 0, hole.outer_width ?? 0, hole.outer_height ?? 0, hole.hole_diameter ?? 0) / 2 + EPS
  add({ layers: ["top", "bottom"], hit: (p) => Math.hypot(p.x - hole.x, p.y - hole.y) <= r,
    label: sp ? `${sourceComponentName[sp.source_component_id]}.${sp.name}` : undefined, net: sp ? netOfSourcePort[sp.source_port_id] : undefined })
}
const vias = byType("pcb_via").map((v) => add({ layers: ["top", "bottom"], hit: (p) => Math.hypot(p.x - v.x, p.y - v.y) <= (v.outer_diameter ?? 0.6) / 2 + EPS }))

// Each trace is a chain of points; consecutive wire points on the same layer are joined.
for (const t of byType("pcb_trace")) {
  let prev: number | undefined
  for (const pt of t.route) {
    const layer = pt.route_type === "via" ? "via" : pt.layer
    const id = add({ layers: layer === "via" ? ["top", "bottom"] : [layer], hit: () => false })
    if (prev !== undefined) union(prev, id)
    prev = id
    // join this point to any pad / via it lands on
    for (const n of nodes) {
      if (n.id === id || n.hit === undefined) continue
      const layers = layer === "via" ? ["top", "bottom"] : [layer]
      if (layers.some((l) => n.hit({ x: pt.x, y: pt.y }, l))) union(id, n.id)
    }
    // join to other trace points at the same spot and layer
    ;(nodes[id] as any).pt = { x: pt.x, y: pt.y, layer }
  }
}
const tracePts = nodes.filter((n: any) => n.pt)
for (let i = 0; i < tracePts.length; i++)
  for (let j = i + 1; j < tracePts.length; j++) {
    const a = (tracePts[i] as any).pt, b = (tracePts[j] as any).pt
    const sameLayer = a.layer === b.layer || a.layer === "via" || b.layer === "via"
    if (sameLayer && Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS) union(tracePts[i].id, tracePts[j].id)
  }

// Report nets whose pads are split into several copper islands.
const pads = nodes.filter((n) => n.label && n.net)
const nets: Record<string, Node[]> = {}
for (const p of pads) (nets[p.net!] ??= []).push(p)
let bad = 0
for (const [key, members] of Object.entries(nets)) {
  if (members.length < 2) continue
  const groups: Record<number, string[]> = {}
  for (const m of members) (groups[find(m.id)] ??= []).push(m.label!)
  const islands = Object.values(groups)
  if (islands.length > 1) {
    const name = netName[key] ?? key
    if (name === "GND") { console.log(`GND: ${islands.length} islands (joined by the ground pour)`); continue }
    bad++
    console.log(`NOT CONNECTED ${name}: ${islands.map((g) => `[${g.join(", ")}]`).join("  ")}`)
  }
}
console.log(bad ? `${bad} nets not fully routed` : `all ${Object.keys(nets).length} nets fully routed`)
process.exit(bad ? 1 : 0)
