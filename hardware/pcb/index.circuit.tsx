/**
 * NJD siren + filter: the MAIN board (all the electronics), lying flat in the 2U chassis.
 *
 * The circuit itself (every resistor, capacitor, op-amp section, pot...) lives in
 * ./circuit/design.ts, the same file the SPICE simulation uses (../spice). This file only
 * decides which real parts implement it and where they go on the board. The panel controls are
 * on the front board (front.circuit.tsx), reached through the ribbon header J6 on the front edge
 * (top of the board here); 12 V DC in and OUT are on the rear edge (bottom).
 *
 * 4 layers: top / GND plane / 12 V plane / bottom. Coordinates in mm, origin at the board centre, Y up.
 */
import { design, packages, type Part } from "./circuit/design"
import { RIBBON } from "./circuit/boards"

// JLCPCB parts, imported with `tsci import --jlcpcb --use-exact-footprint <C-number>`
// (`footprint="jlcpcb:..."` strings do not load in the `tsci dev` view: tscircuit/tscircuit#4048).
import { NRJ4HF } from "./imports/NRJ4HF" // Neutrik 6.35 mm mono jack, panel nut (OUT)
import { IDC_2x25 } from "./imports/IDC_2x25" // ribbon to the front board
import { DC_005_2_5A_2_0 } from "./imports/DC_005_2_5A_2_0" // C319099 5.5/2.1 mm DC jack
import { TLC2274IDR_UMW_ } from "./imports/TLC2274IDR_UMW_" // C22368276 quad rail-to-rail op-amp
import { LM13700MX_NOPB } from "./imports/LM13700MX_NOPB" // C174050 dual OTA
import { TC4S66F_LF } from "./imports/TC4S66F_LF" // C146314 single analog switch
import { A_1N4148WS } from "./imports/A_1N4148WS" // C7420319
import { SS14 } from "./imports/SS14" // C2480 reverse-polarity protection
import { RVT100UF35V67RV0034 } from "./imports/RVT100UF35V67RV0034" // C2836442 100 uF 35 V SMD electrolytic


const net = (n: string) => `net.${n}`
type Conn = Record<string, string>
const conns = (c: Conn) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, net(v)]))

// ---------------------------------------------------------------- layout
const W = 176
const H = 104
const RIBBON_Y = H / 2 - 6.5 // J6, along the front edge
const ROW_A = 8 // clusters next to the ribbon
const ROW_B = -20
const OUT_X = W / 2 - 18 // OUT jack axis, rear edge

/**
 * Small parts are packed in one cluster per chip (the chip + the parts wired to it), so chips
 * never overlap. Cluster centres follow the signal path; "power" holds the 6 V reference parts.
 */
const CLUSTERS: Record<string, { x: number; y: number }> = {
  // row A follows the ribbon, left to right: pitch CV, LFO, carrier, filter
  U3: { x: -68, y: ROW_A }, // envelopes + pitch CV
  U1: { x: -38, y: ROW_A }, // 6 V reference + LFO core
  U2: { x: -14, y: ROW_A }, // LFO shapes + selector buffer
  U4: { x: 10, y: ROW_A }, // carrier comparator / shapes
  U5: { x: 38, y: ROW_A }, // VCA buffer, drive, cutoff CV
  U6: { x: 66, y: ROW_A }, // filter buffers, gate buffer
  // row B: the analog switches under their oscillator, VCA, filter OTAs, output
  U9: { x: -40, y: ROW_B }, // LFO saw switch
  U10: { x: -24, y: ROW_B }, // random sample & hold
  U11: { x: -6, y: ROW_B }, // carrier saw switch
  U7: { x: 14, y: ROW_B }, // carrier OTA + VCA
  U8: { x: 42, y: ROW_B }, // filter OTAs
  OUT: { x: 62, y: ROW_B + 4 }, // volume output, next to the OUT jack
}

// ---------------------------------------------------------------- parts
const PIN_TLC2274 = {
  A: { o: "pin1", m: "pin2", p: "pin3" },
  B: { p: "pin5", m: "pin6", o: "pin7" },
  C: { o: "pin8", m: "pin9", p: "pin10" },
  D: { p: "pin12", m: "pin13", o: "pin14" },
} as const
const PIN_LM13700 = {
  A: { abc: "pin1", p: "pin3", m: "pin4", o: "pin5" },
  B: { o: "pin12", m: "pin13", p: "pin14", abc: "pin16" },
} as const

/** Quad op-amp / dual OTA packages built from the design's sections. */
function OpampPackage({ pkg }: { pkg: string }) {
  const sections = design.filter((p): p is Extract<Part, { t: "OPA" }> => p.t === "OPA" && p.pkg === pkg)
  const c: Conn = { pin4: "V12", pin11: "GND" }
  for (const s of sections) {
    const m = PIN_TLC2274[s.section]
    c[m.p] = s.p; c[m.m] = s.m; c[m.o] = s.o
  }
  return <TLC2274IDR_UMW_ name={pkg} connections={conns(c) as any} />
}
function OtaPackage({ pkg }: { pkg: string }) {
  const sections = design.filter((p): p is Extract<Part, { t: "OTA" }> => p.t === "OTA" && p.pkg === pkg)
  // V- = GND, V+ = 12 V; Darlington buffer inputs tied low (unused), diode-bias and buffer outputs open
  const c: Conn = { pin6: "GND", pin11: "V12", pin7: "GND", pin10: "GND" }
  for (const s of sections) {
    const m = PIN_LM13700[s.section]
    c[m.abc] = s.abc; c[m.p] = s.p; c[m.m] = s.m; c[m.o] = s.o
  }
  return <LM13700MX_NOPB name={pkg} connections={conns(c) as any} noConnect={["pin2", "pin8", "pin9", "pin15"] as any} />
}

const valueText = (v: number, unit: string) => {
  const [div, suffix] = v >= 1e6 ? [1e6, "M"] : v >= 1e3 ? [1e3, "k"] : v >= 1 ? [1, ""] : v >= 1e-6 ? [1e-6, "u"] : v >= 1e-9 ? [1e-9, "n"] : [1e-12, "p"]
  return `${+(v / div).toPrecision(3)}${suffix}${unit}`
}

/** Small parts of one block (everything except pots, rotary selectors and packages). */
function smallPart(p: Part) {
  switch (p.t) {
    case "R":
      return <resistor key={p.ref} name={p.ref} resistance={valueText(p.value, "")} footprint="0603" connections={{ pin1: net(p.a), pin2: net(p.b) }} />
    case "C":
      if (p.size === "elec")
        // pin1 = + (chamfered side)
        return <RVT100UF35V67RV0034 key={p.ref} name={p.ref} connections={{ pin1: net(p.a), pin2: net(p.b) }} />
      return <capacitor key={p.ref} name={p.ref} capacitance={valueText(p.value, "F")} footprint={p.size ?? "0603"} connections={{ pin1: net(p.a), pin2: net(p.b) }} />
    case "D":
      return <A_1N4148WS key={p.ref} name={p.ref} connections={{ anode: net(p.anode), cathode: net(p.cathode) }} />
    case "SW":
      return <TC4S66F_LF key={p.ref} name={p.ref} connections={{ pin1: net(p.io1), pin2: net(p.io2), VSS: net("GND"), CONT: net(p.ctl), VDD: net("V12") } as any} />
    default:
      return null
  }
}

/** chip each small part belongs to: the package it shares the most nets with (same block first) */
const CHIP_PINS: Record<string, Set<string>> = {}
for (const p of design) {
  if (p.t === "OPA" || p.t === "OTA") (CHIP_PINS[p.pkg] ??= new Set()).add(p.p).add(p.m).add(p.o).add(p.t === "OTA" ? p.abc : p.o)
  if (p.t === "SW") (CHIP_PINS[p.ref] ??= new Set()).add(p.io1).add(p.io2).add(p.ctl)
}
const RAILS = new Set(["GND", "V12", "VREF"])
const partNets = (p: Part): string[] =>
  p.t === "R" || p.t === "C" ? [p.a, p.b] : p.t === "D" ? [p.anode, p.cathode] : []
/** parts whose nets alone do not say where they belong (passive sum nodes) */
const PLACE: Record<string, string> = { R76: "U2", R78: "U2" }
const BLOCK_CHIP: Record<string, string> = { power: "U1", lfo: "U1", lfo2: "U2", env: "U3", vco: "U3", vca: "U5", filter: "U5", out: "OUT" }
const CLUSTER_OF: Record<string, string> = {}
{
  const small = design.filter((p) => ["R", "C", "D"].includes(p.t))
  const signalNets = (p: Part) => partNets(p).filter((n) => !RAILS.has(n))
  // 1. parts wired to a chip pin go with that chip (the one they share the most nets with)
  for (const p of small) {
    if (PLACE[p.ref]) { CLUSTER_OF[p.ref] = PLACE[p.ref]; continue }
    let best = "", score = 0
    for (const [chip, pins] of Object.entries(CHIP_PINS)) {
      const s = signalNets(p).filter((n) => pins.has(n)).length
      if (s > score) { best = chip; score = s }
    }
    if (score) CLUSTER_OF[p.ref] = best
  }
  // 2. the others (diode strings, sum nodes...) follow the parts they share a net with
  for (let changed = true; changed; ) {
    changed = false
    for (const p of small) {
      if (CLUSTER_OF[p.ref]) continue
      const votes: Record<string, number> = {}
      for (const q of small)
        if (q !== p && CLUSTER_OF[q.ref] && signalNets(q).some((n) => signalNets(p).includes(n)))
          votes[CLUSTER_OF[q.ref]] = (votes[CLUSTER_OF[q.ref]] ?? 0) + 1
      const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]
      if (best) { CLUSTER_OF[p.ref] = best[0]; changed = true }
    }
  }
  // 3. parts only touching rails / pots (reference divider, pot end resistors...): keep them by block
  for (const p of small) CLUSTER_OF[p.ref] ??= BLOCK_CHIP[p.group]
}
const clusterOf = (p: Part) => CLUSTER_OF[p.ref]

function Cluster({ chip }: { chip: string }) {
  const parts = design.filter((p) => ["R", "C", "D"].includes(p.t) && clusterOf(p) === chip)
  const at = CLUSTERS[chip]
  const isOpamp = packages.opamp.includes(chip), isOta = packages.ota.includes(chip), isSw = packages.switch.includes(chip)
  const sw = isSw ? (design.find((p) => p.ref === chip) as Part) : undefined
  return (
    <group name={`cl_${chip}`} pcbPack pcbPackGap="0.6mm" pcbX={at.x} pcbY={at.y}>
      {isOpamp && <OpampPackage pkg={chip} />}
      {isOta && <OtaPackage pkg={chip} />}
      {sw && smallPart(sw)}
      {/* 100 nF decoupling next to every chip */}
      {(isOpamp || isOta || isSw) && <capacitor name={`C${chip}`} capacitance="100nF" footprint="0603" connections={{ pin1: net("V12"), pin2: net("GND") }} />}
      {parts.map(smallPart)}
    </group>
  )
}

const Label = (p: { text: string; x: number; y: number; size?: number }) => (
  <silkscreentext text={p.text} pcbX={p.x} pcbY={p.y} fontSize={`${p.size ?? 1.6}mm`} />
)

export default () => (
  <board width={`${W}mm`} height={`${H}mm`} borderRadius="3mm" title="NJD siren main" layers={4}
    nominalTraceWidth="0.3mm" minTraceWidth="0.2mm" routeRemaining autorouter={{ traceClearance: "0.15mm" }} autorouterEffortLevel="2x">
    {/* ===== ribbon to the front board (pots, selectors, LATCH, POWER, FIRE) ===== */}
    <IDC_2x25 name="J6" connections={Object.fromEntries(RIBBON.map((n, i) => [`pin${i + 1}`, net(n)])) as any} pcbX={-1.27} pcbY={RIBBON_Y} />
    <Label text="FRONT" x={-44} y={RIBBON_Y} size={1.6} />
    {/* FIRE / LATCH pull GATE to 12 V */}
    <resistor name="R91" resistance="100k" footprint="0603" connections={{ pin1: net("GATE"), pin2: net("GND") }}
      pcbX={-W / 2 + 8} pcbY={RIBBON_Y} />

    {/* ===== small parts, clustered around their chip ===== */}
    {Object.keys(CLUSTERS).map((chip) => <Cluster key={chip} chip={chip} />)}

    {/* ===== rear edge: 12 V DC jack (pin1 = centre +), reverse-polarity diode (after the POWER switch), OUT ===== */}
    <DC_005_2_5A_2_0 name="J1" connections={{ pin1: net("VIN"), pin2: net("GND"), pin3: net("GND") }}
      pcbX={-W / 2 + 15} pcbY={-H / 2 + 11} pcbRotation={90} />
    <Label text="12V DC" x={-W / 2 + 15} y={-H / 2 + 21} size={1.2} />
    <SS14 name="D1" connections={{ anode: net("VSW"), cathode: net("V12") }} pcbX={-W / 2 + 26} pcbY={-H / 2 + 6} />
    <capacitor name="C90" capacitance="22uF" footprint="0805" connections={{ pin1: net("V12"), pin2: net("GND") }}
      pcbX={-W / 2 + 33} pcbY={-H / 2 + 6} />
    <capacitor name="C91" capacitance="22uF" footprint="0805" connections={{ pin1: net("V12"), pin2: net("GND") }}
      pcbX={-W / 2 + 37} pcbY={-H / 2 + 6} />
    {/* OUT: 6.35 mm mono jack, nose through the rear panel (body face on the board edge) */}
    <NRJ4HF name="J3" connections={{ T: net("OUT"), S: net("GND") }} noConnect={["TN", "SN"]}
      pcbX={OUT_X} pcbY={-H / 2 + 0.2} pcbRotation={-90} />
    <Label text="OUT" x={OUT_X} y={-H / 2 + 27} size={1.4} />

    {/* 4 layers: signals top/bottom, solid GND plane on inner1, 12 V plane on inner2 */}
    <copperpour connectsTo="net.GND" layer="inner1" clearance="0.3mm" unbroken />
    <copperpour connectsTo="net.V12" layer="inner2" clearance="0.3mm" unbroken />
    <copperpour connectsTo="net.GND" layer="bottom" clearance="0.3mm" />
    <hole name="H1" diameter="3.2mm" pcbX={-W / 2 + 4} pcbY={H / 2 - 4} />
    <hole name="H2" diameter="3.2mm" pcbX={W / 2 - 4} pcbY={H / 2 - 4} />
    <hole name="H3" diameter="3.2mm" pcbX={-W / 2 + 4} pcbY={-H / 2 + 4} />
    <hole name="H4" diameter="3.2mm" pcbX={W / 2 - 4} pcbY={-H / 2 + 4} />
  </board>
)
