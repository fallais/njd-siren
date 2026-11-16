/**
 * Check that the board (index.circuit.tsx) wires exactly what circuit/design.ts describes.
 * Reads `tsci check netlist` output and compares it, net by net, with the design.
 *
 * Usage: bun scripts/check-design-netlist.ts
 */
import { $ } from "bun"
import { design } from "../circuit/design"

const TLC = { A: { o: 1, m: 2, p: 3 }, B: { p: 5, m: 6, o: 7 }, C: { o: 8, m: 9, p: 10 }, D: { p: 12, m: 13, o: 14 } } as const
const LM = { A: { abc: 1, p: 3, m: 4, o: 5 }, B: { o: 12, m: 13, p: 14, abc: 16 } } as const

// expected: net -> set of "REF.pinN"
const want = new Map<string, Set<string>>()
const add = (net: string, pin: string) => (want.get(net) ?? want.set(net, new Set()).get(net)!).add(pin)
const pkgs = new Set<string>()
for (const p of design) {
  switch (p.t) {
    case "R": case "C": add(p.a, `${p.ref}.pin1`); add(p.b, `${p.ref}.pin2`); break
    case "D": add(p.anode, `${p.ref}.pin1`); add(p.cathode, `${p.ref}.pin2`); break // 1N4148WS: pin1 = anode
    case "POT": add(p.ccw, `${p.ref}.pin1`); add(p.wiper, `${p.ref}.pin2`); add(p.cw ?? p.wiper, `${p.ref}.pin3`)
      add("GND", `${p.ref}.pin4`); add("GND", `${p.ref}.pin5`); break
    case "OPA": { const m = TLC[p.section]; add(p.p, `${p.pkg}.pin${m.p}`); add(p.m, `${p.pkg}.pin${m.m}`); add(p.o, `${p.pkg}.pin${m.o}`)
      if (!pkgs.has(p.pkg)) { pkgs.add(p.pkg); add("V12", `${p.pkg}.pin4`); add("GND", `${p.pkg}.pin11`); add("V12", `C${p.pkg}.pin1`); add("GND", `C${p.pkg}.pin2`) } break }
    case "OTA": { const m = LM[p.section]; add(p.abc, `${p.pkg}.pin${m.abc}`); add(p.p, `${p.pkg}.pin${m.p}`); add(p.m, `${p.pkg}.pin${m.m}`); add(p.o, `${p.pkg}.pin${m.o}`)
      if (!pkgs.has(p.pkg)) { pkgs.add(p.pkg); for (const [n, pin] of [["GND", 6], ["V12", 11], ["GND", 7], ["GND", 10]] as const) add(n, `${p.pkg}.pin${pin}`); add("V12", `C${p.pkg}.pin1`); add("GND", `C${p.pkg}.pin2`) } break }
    case "SW": add(p.io1, `${p.ref}.pin1`); add(p.io2, `${p.ref}.pin2`); add("GND", `${p.ref}.pin3`); add(p.ctl, `${p.ref}.pin4`); add("V12", `${p.ref}.pin5`)
      add("V12", `C${p.ref}.pin1`); add("GND", `C${p.ref}.pin2`); break
    case "SEL": add(p.com, `${p.ref}.pin1`); p.throws.forEach((t, i) => add(t, `${p.ref}.pin${i + 2}`)); break
  }
}
// board-only parts (switches, power, connectors)
const extra: [string, string][] = [
  ["V12", "SW1.pin1"], ["GATE", "SW1.pin4"], ["V12", "SW2.pin2"], ["GATE", "SW2.pin1"], ["VIN", "SW3.pin2"], ["VSW", "SW3.pin1"],
  ["LED_A", "D2.pin2"], ["GND", "D2.pin1"], ["V12", "R90.pin1"], ["LED_A", "R90.pin2"], ["GATE", "R91.pin1"], ["GND", "R91.pin2"],
  ["VIN", "J1.pin1"], ["GND", "J1.pin2"], ["GND", "J1.pin3"], ["VSW", "D1.pin2"], ["V12", "D1.pin1"],
  ["V12", "C90.pin1"], ["GND", "C90.pin2"], ["V12", "C91.pin1"], ["GND", "C91.pin2"],
  ["V12", "J2.pin1"], ["GATE", "J2.pin2"], ["OUT", "J3.pin1"], ["GND", "J3.pin2"],
]
for (const [n, pin] of extra) add(n, pin)

// actual, from tsci
const text = await $`npx tsci check netlist`.cwd(import.meta.dir + "/..").quiet().text()
const got = new Map<string, Set<string>>()
let cur = ""
for (const line of text.split("\n")) {
  const m = line.match(/^NET: (\S+)/)
  if (m) { cur = m[1]; got.set(cur, new Set()); continue }
  const e = line.match(/^ {2}- (\S+) (\S+)/)
  if (e && cur) {
    // pins are printed as pinN, or by label (anode, cathode, VDD_GND, EH1...); normalise to pinN via the "(...)" hint where needed
    let pin = e[2]
    const named: Record<string, string> = { anode: "pin1", cathode: "pin2", EH1: "pin4", EH2: "pin5", VSS: "pin3", CONT: "pin4", VDD: "pin5", IN1: "pin2", OUT1: "pin2", IN2: "pin1", OUT2: "pin1" }
    if (!/^pin\d+$/.test(pin)) pin = named[pin] ?? pin
    got.get(cur)!.add(`${e[1]}.${pin}`)
  }
}
// LED / SS14 use pin1 = cathode: flip their normalisation
for (const set of got.values()) for (const ref of ["D1", "D2"]) {
  const a = set.has(`${ref}.pin1`), k = set.has(`${ref}.pin2`)
  if (a !== k) { set.delete(`${ref}.pin${a ? 1 : 2}`); set.add(`${ref}.pin${a ? 2 : 1}`) }
}
// electrolytics print as pin1 (+) / pin2 (-): already pinN

let bad = 0
const nets = new Set([...want.keys(), ...got.keys()])
for (const n of [...nets].sort()) {
  const w = want.get(n) ?? new Set(), g = got.get(n) ?? new Set()
  const missing = [...w].filter((x) => !g.has(x)), extraPins = [...g].filter((x) => !w.has(x))
  if (missing.length || extraPins.length) {
    bad++
    console.log(`${n}: missing [${missing.join(", ")}] unexpected [${extraPins.join(", ")}]`)
  }
}
console.log(bad ? `${bad} nets differ from the design` : `board matches the design: ${nets.size} nets`)
process.exit(bad ? 1 : 0)
