// Run the siren netlist in ngspice (WASM) and print measurements.
// Usage: bun sim.ts '<json knobs override>' <tstop>
import { Simulation } from "eecircuit-engine"
import { netlist, type Settings } from "./netlist"

export const defaults: Settings = {
  tone: 0.5, speed: 0.3, depth: 0.6, sweep: 0.5, glide: 0.3, release: 0.1, volume: 0.8,
  drive: 0.2, cutoff: 0.9, resonance: 0.2, lfoCutoff: 0, lfoWave: "tri", carrier: "sqr",
  gate: { on: 0.05, off: 10 },
}

export async function run(over: Partial<Settings>, tstop: number, tstep = 5e-6) {
  const sim = new Simulation()
  await sim.start()
  sim.setNetList(netlist({ ...defaults, ...over }, tstop, tstep))
  const r: any = await sim.runSim()
  const get = (n: string) => r.data.find((d: any) => d.name.toLowerCase() === `v(${n.toLowerCase()})`)?.values as number[]
  return { time: r.data[0].values as number[], get, names: r.data.map((d: any) => d.name) }
}

/** rising crossings of `level` between t0 and t1 */
export const crossings = (t: number[], v: number[], level: number, t0 = 0, t1 = Infinity) => {
  const out: number[] = []
  for (let i = 1; i < v.length; i++) if (t[i] >= t0 && t[i] <= t1 && v[i - 1] < level && v[i] >= level) out.push(t[i])
  return out
}
export const freqs = (c: number[]) => c.slice(1).map((x, i) => 1 / (x - c[i]))
export const range = (t: number[], v: number[], t0: number, t1: number) => {
  let lo = Infinity, hi = -Infinity
  for (let i = 0; i < v.length; i++) if (t[i] >= t0 && t[i] <= t1) { lo = Math.min(lo, v[i]); hi = Math.max(hi, v[i]) }
  return [lo, hi]
}

if (import.meta.main) {
  const over = JSON.parse(process.argv[2] ?? "{}")
  const tstop = Number(process.argv[3] ?? 1)
  const t0 = performance.now()
  const { time, get, names } = await run(over, tstop)
  console.log(`simulated ${tstop}s in ${((performance.now() - t0) / 1000).toFixed(1)}s, ${time.length} points`)
  const show = (n: string) => { const v = get(n); if (!v) return console.log(n, "missing"); const [lo, hi] = range(time, v, tstop * 0.3, tstop); console.log(`${n.padEnd(7)} ${lo.toFixed(2)} .. ${hi.toFixed(2)} V`) }
  for (const n of ["VREF", "SQ", "TRI", "LFO", "CV", "TRI_C", "SQ_C", "CAR", "ENVB", "VCA", "CLP", "FOUT", "OUT"]) show(n)
  const lfoF = freqs(crossings(time, get("SQ"), 6, tstop * 0.3))
  const vcoF = freqs(crossings(time, get("SQ_C"), 6, tstop * 0.3))
  console.log(`LFO ${lfoF.length ? (lfoF.reduce((a, b) => a + b) / lfoF.length).toFixed(2) : "-"} Hz`)
  console.log(`VCO ${vcoF.length ? `${Math.min(...vcoF).toFixed(0)} .. ${Math.max(...vcoF).toFixed(0)} Hz` : "-"}`)
  process.exit(0)
}
