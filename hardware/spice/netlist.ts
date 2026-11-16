/**
 * Turn hardware/pcb/circuit/design.ts into an ngspice netlist with behavioural models.
 * The supply and the FIRE gate are ideal sources; the panel rotary switches pick one throw.
 */
import { design, type Knob, type Part } from "../pcb/circuit/design"

export type Settings = Record<Knob, number> & {
  lfoWave: "sine" | "tri" | "sqr" | "saw" | "ramp" | "rnd"
  carrier: "sine" | "sqr" | "saw" | "tri"
  gate: { on: number; off: number } // seconds
}

const MODELS = `
.model D1N4148 D(Is=2.52n Rs=0.568 N=1.752 Cjo=4p M=0.4 tt=20n Bv=100)
.model SWM SW(Vt=6 Vh=0.5 Ron=70 Roff=1G)
* TLC2274 section: rail-to-rail output 0.05..11.95 V, single pole
.subckt OPA p m out
B1 n1 0 V = max(-8, min(8, 1e5*(V(p)-V(m))))
R1 n1 n2 1k
C1 n2 0 16n
B2 out 0 V = max(0.05, min(11.95, 6 + V(n2)))
.ends
* LM13700 half: Iabc pin sits two diode drops above ground; output current = Iabc * tanh(Vd / 2Vt)
.subckt OTA p m out abc
Vs abc a1 0
D1 a1 a2 D1N4148
D2 a2 0 D1N4148
B1 out 0 I = -max(I(Vs),0)*tanh((V(p)-V(m))/0.052)
.ends
`

const n = (net: string) => (net === "GND" ? "0" : net)
const clamp = (x: number) => Math.min(Math.max(x, 0.002), 0.998)

function line(p: Part, s: Settings): string {
  switch (p.t) {
    case "R": return `R${p.ref} ${n(p.a)} ${n(p.b)} ${p.value}`
    case "C": return `C${p.ref} ${n(p.a)} ${n(p.b)} ${p.value}${p.ic !== undefined ? ` IC=${p.ic}` : ""}`
    case "D": return `D${p.ref} ${n(p.anode)} ${n(p.cathode)} D1N4148`
    case "OPA": return `X${p.ref} ${n(p.p)} ${n(p.m)} ${n(p.o)} OPA`
    case "OTA": return `X${p.ref} ${n(p.p)} ${n(p.m)} ${n(p.o)} ${n(p.abc)} OTA`
    case "SW": return `S${p.ref} ${n(p.io1)} ${n(p.io2)} ${n(p.ctl)} 0 SWM`
    case "POT": {
      const x = clamp(s[p.knob])
      const a = `R${p.ref}a ${n(p.ccw)} ${n(p.wiper)} ${(p.value * x).toFixed(1)}`
      return p.cw ? `${a}\nR${p.ref}b ${n(p.wiper)} ${n(p.cw)} ${(p.value * (1 - x)).toFixed(1)}` : a
    }
    case "SEL": {
      const pick = p.label === "LFO WAVE" ? s.lfoWave : s.carrier
      const i = p.names.indexOf(pick)
      if (i < 0) throw new Error(`${p.label}: no position ${pick}`)
      return `R${p.ref} ${n(p.throws[i])} ${n(p.com)} 10`
    }
  }
}

export function netlist(s: Settings, tstop: number, tstep = 5e-6, save?: string[]) {
  return [
    "NJD siren (generated from hardware/pcb/circuit/design.ts)",
    MODELS,
    "V12 V12 0 12",
    `VG GATE 0 PULSE(0 12 ${s.gate.on} 1m 1m ${s.gate.off - s.gate.on} 100)`,
    ...design.map((p) => line(p, s)),
    // keep only the probed nodes: long runs otherwise exhaust the WASM heap
    ...(save ? [`.save ${save.map((x) => `v(${x})`).join(" ")}`] : []),
    ".options method=gear reltol=1e-3 abstol=1e-10 vntol=1e-5 itl4=50",
    `.tran ${tstep} ${tstop} 0 ${tstep} uic`,
    ".end",
  ].join("\n")
}
