// Scenario checks for every control. Usage: bun tests.ts [name...]
import { run, crossings, freqs, range } from "./sim"

const spark = (t: number[], v: number[], t0: number, t1: number, n = 60) => {
  const chars = "▁▂▃▄▅▆▇█"
  const pts: number[] = []
  for (let k = 0; k < n; k++) {
    const tt = t0 + ((t1 - t0) * k) / n
    let i = t.findIndex((x) => x >= tt); if (i < 0) i = t.length - 1
    pts.push(v[i])
  }
  const lo = Math.min(...pts), hi = Math.max(...pts)
  return pts.map((p) => chars[Math.round(((p - lo) / (hi - lo || 1)) * 7)]).join("") + `  (${lo.toFixed(2)}..${hi.toFixed(2)} V)`
}
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y) / a.length : NaN)
/** VCO frequency over time windows */
const vcoAt = (t: number[], sq: number[], t0: number, t1: number) => mean(freqs(crossings(t, sq, 6, t0, t1)))

const scenarios: Record<string, () => Promise<void>> = {
  async tone() {
    for (const tone of [0, 0.25, 0.5, 0.75, 1]) {
      const { time, get } = await run({ tone, depth: 0 }, 0.15)
      console.log(`tone ${tone}: VCO ${vcoAt(time, get("SQ_C"), 0.05, 0.15).toFixed(0)} Hz`)
    }
  },
  async speed() {
    for (const speed of [0, 0.5, 1]) {
      const tstop = speed === 0 ? 3 : 0.8
      const { time, get } = await run({ speed, depth: 0 }, tstop, 2e-5, ["SQ"])
      console.log(`speed ${speed}: LFO ${mean(freqs(crossings(time, get("SQ"), 6, tstop * 0.2))).toFixed(2)} Hz`)
    }
  },
  async lfowaves() {
    for (const lfoWave of ["sine", "tri", "sqr", "saw", "ramp", "rnd"] as const) {
      const { time, get } = await run({ lfoWave, speed: 0.4, depth: 0.6 }, 0.6, 1e-5)
      const c = crossings(time, get("SQ"), 6, 0.2)
      const t0 = c[0], t1 = c[2] ?? c[1] + (c[1] - c[0])
      const vco = freqs(crossings(time, get("SQ_C"), 6, 0.2))
      console.log(`${lfoWave.padEnd(5)} LFO ${spark(time, get("LFO"), t0, t1)}  VCO ${Math.min(...vco).toFixed(0)}..${Math.max(...vco).toFixed(0)} Hz`)
    }
  },
  async carriers() {
    for (const carrier of ["sine", "tri", "sqr", "saw"] as const) {
      const { time, get } = await run({ carrier, depth: 0 }, 0.1, 2e-6)
      const c = crossings(time, get("SQ_C"), 6, 0.05)
      console.log(`${carrier.padEnd(5)} CAR ${spark(time, get("CAR"), c[0], c[2])}`)
    }
  },
  async release() {
    for (const release of [0, 0.3, 1]) {
      const { time, get } = await run({ release, depth: 0, gate: { on: 0.02, off: 0.12 } }, release === 1 ? 3.0 : 1.2, 4e-5, ["ENVB", "VCA"])
      const env = get("ENVB")
      const [, peak] = range(time, env, 0.05, 0.12)
      const i = time.findIndex((t, k) => t > 0.12 && env[k] < 1.2 + (peak - 1.2) * 0.1)
      const [lo, hi] = range(time, get("VCA"), 0.08, 0.11)
      console.log(`release ${release}: VCA ${(hi - lo).toFixed(2)} Vpp while held, fades to 10% in ${i > 0 ? ((time[i] - 0.12) * 1000).toFixed(0) + " ms" : "> run"}`)
    }
  },
  async sweep() {
    for (const [sweep, glide] of [[0.5, 0.3], [1, 0.3], [0, 0.3], [1, 1]] as const) {
      const { time, get } = await run({ sweep, glide, depth: 0, gate: { on: 0.05, off: 10 } }, 1.0, 1e-5)
      const sq = get("SQ_C")
      const w = (a: number) => vcoAt(time, sq, a, a + 0.02).toFixed(0)
      console.log(`sweep ${sweep} glide ${glide}: VCO before ${w(0.02)} | +10ms ${w(0.06)} | +100ms ${w(0.15)} | +300ms ${w(0.35)} | +900ms ${w(0.95 - 0.02)} Hz`)
    }
  },
  async filter() {
    for (const [cutoff, resonance] of [[1, 0], [0.6, 0], [0.3, 0], [0.6, 0.9], [0.3, 1]] as const) {
      const { time, get } = await run({ cutoff, resonance, depth: 0, drive: 0, carrier: "sqr" }, 0.12, 2e-6)
      const [a, b] = range(time, get("CLP"), 0.06, 0.12)
      const [c, d] = range(time, get("FOUT"), 0.06, 0.12)
      const cc = crossings(time, get("SQ_C"), 6, 0.08)
      console.log(`cutoff ${cutoff} res ${resonance}: in ${(b - a).toFixed(2)} Vpp, out ${(d - c).toFixed(2)} Vpp  ${spark(time, get("FOUT"), cc[0], cc[1])}`)
    }
  },
  async drive() {
    for (const drive of [0, 0.5, 1]) {
      const { time, get } = await run({ drive, depth: 0, carrier: "sine", cutoff: 1, gate: { on: 0.005, off: 10 } }, 0.08, 2e-6)
      const cc = crossings(time, get("SQ_C"), 6, 0.05)
      console.log(`drive ${drive}: ${spark(time, get("CLP"), cc[0], cc[1])}`)
    }
  },
}
for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(scenarios)) {
  console.log(`== ${name}`)
  await scenarios[name]()
}
process.exit(0)
