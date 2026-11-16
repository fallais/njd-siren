/**
 * NJD siren + filter: the PCB.
 *
 * The circuit itself (every resistor, capacitor, op-amp section, pot...) lives in
 * ./circuit/design.ts, the same file the SPICE simulation uses (../spice). This file only
 * decides which real parts implement it and where they go on the board.
 *
 * 12 V DC in. Front panel = top of the board: SIREN knobs on the first row, FILTER knobs,
 * FIRE / LATCH / POWER on the second. Wire connectors on the bottom edge.
 * Coordinates in mm, origin at the board centre, Y up.
 */
import { design, type Group, type Part } from "./circuit/design"

// JLCPCB parts, imported with `tsci import --jlcpcb --use-exact-footprint <C-number>`
// (`footprint="jlcpcb:..."` strings do not load in the `tsci dev` view: tscircuit/tscircuit#4048).
import { RK09K1130A70 } from "./imports/RK09K1130A70" // C351173 9 mm pot, 10k linear
import { ST_0_102_A01_T000_LF } from "./imports/ST_0_102_A01_T000_LF" // C1788487 mini toggle SPDT
import { B3F_4055 } from "./imports/B3F_4055" // C84931 12x12 mm tactile
import { HX25003_2A } from "./imports/HX25003_2A" // C442299 2-pin XH
import { A_2541WV_07P } from "./imports/A_2541WV_07P" // C25503132 7-pin 2.54 mm wafer (rotary switches)
import { DC_005_2_5A_2_0 } from "./imports/DC_005_2_5A_2_0" // C319099 5.5/2.1 mm DC jack
import { TLC2274IDR_UMW_ } from "./imports/TLC2274IDR_UMW_" // C22368276 quad rail-to-rail op-amp
import { LM13700MX_NOPB } from "./imports/LM13700MX_NOPB" // C174050 dual OTA
import { TC4S66F_LF } from "./imports/TC4S66F_LF" // C146314 single analog switch
import { A_1N4148WS } from "./imports/A_1N4148WS" // C7420319
import { SS14 } from "./imports/SS14" // C2480 reverse-polarity protection
import { NCD0805R1 } from "./imports/NCD0805R1" // C84256 red LED
import { RVT100UF35V67RV0034 } from "./imports/RVT100UF35V67RV0034" // C2836442 100 uF 35 V SMD electrolytic


const net = (n: string) => `net.${n}`
type Conn = Record<string, string>
const conns = (c: Conn) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, net(v)]))

// ---------------------------------------------------------------- layout
const W = 170
const H = 120
const KNOB_DX = 23
const COLS = [-3, -2, -1, 0, 1, 2, 3].map((i) => i * KNOB_DX) // 7 columns
const SIREN_Y = 46 // shaft centres, row 1
const FILTER_Y = 22 // shaft centres, row 2
const POT_SHAFT_DY = 3.9 // RK09K: shaft centre is 3.9 mm above the footprint origin

/** where each panel pot goes (shaft position) */
const KNOBS: Record<string, { x: number; y: number }> = {
  RV1: { x: COLS[0], y: SIREN_Y }, // TONE
  RV2: { x: COLS[1], y: SIREN_Y }, // SPEED
  RV3: { x: COLS[2], y: SIREN_Y }, // DEPTH
  RV4: { x: COLS[3], y: SIREN_Y }, // SWEEP
  RV5: { x: COLS[4], y: SIREN_Y }, // GLIDE
  RV6: { x: COLS[5], y: SIREN_Y }, // RELEASE
  RV7: { x: COLS[6], y: SIREN_Y }, // VOLUME
  RV8: { x: COLS[0], y: FILTER_Y }, // DRIVE
  RV9: { x: COLS[1], y: FILTER_Y }, // CUTOFF
  RV10: { x: COLS[2], y: FILTER_Y }, // RESONANCE
  RV11: { x: COLS[3], y: FILTER_Y }, // LFO > CUTOFF
}

/** centre of each block of small parts (auto-packed around its chips) */
const BLOCKS: Record<Group, { x: number; y: number }> = {
  lfo: { x: -62, y: -6 },
  lfo2: { x: -31, y: -6 },
  env: { x: 0, y: -6 },
  vco: { x: 31, y: -6 },
  vca: { x: 62, y: -6 },
  power: { x: -62, y: -33 },
  filter: { x: 0, y: -33 },
  out: { x: 50, y: -33 },
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

function Block({ group }: { group: Group }) {
  const parts = design.filter((p) => p.group === group)
  // a package shared by several blocks is placed in the block of its first section
  const home = (pkg: string) => design.find((p) => (p.t === "OPA" || p.t === "OTA") && p.pkg === pkg)!.group
  const opamps = [...new Set(parts.flatMap((p) => (p.t === "OPA" && home(p.pkg) === group ? [p.pkg] : [])))]
  const otas = [...new Set(parts.flatMap((p) => (p.t === "OTA" && home(p.pkg) === group ? [p.pkg] : [])))]
  const switches = parts.filter((p) => p.t === "SW").map((p) => p.ref)
  const at = BLOCKS[group]
  return (
    <group name={`blk_${group}`} pcbPack pcbPackGap="0.8mm" pcbX={at.x} pcbY={at.y}>
      {opamps.map((pkg) => <OpampPackage key={pkg} pkg={pkg} />)}
      {otas.map((pkg) => <OtaPackage key={pkg} pkg={pkg} />)}
      {/* 100 nF decoupling next to every chip */}
      {[...opamps, ...otas, ...switches].map((u) => (
        <capacitor key={`C_${u}`} name={`C${u}`} capacitance="100nF" footprint="0603" connections={{ pin1: net("V12"), pin2: net("GND") }} />
      ))}
      {parts.map(smallPart)}
    </group>
  )
}

const Label = (p: { text: string; x: number; y: number; size?: number }) => (
  <silkscreentext text={p.text} pcbX={p.x} pcbY={p.y} fontSize={`${p.size ?? 1.6}mm`} />
)

function Knob({ p }: { p: Extract<Part, { t: "POT" }> }) {
  const at = KNOBS[p.ref]
  // a rheostat leaves the CW end free: tie it to the wiper
  return (
    <>
      <RK09K1130A70
        name={p.ref}
        connections={{ pin1: net(p.ccw), pin2: net(p.wiper), pin3: net(p.cw ?? p.wiper), EH1: net("GND"), EH2: net("GND") }}
        pcbX={at.x}
        pcbY={at.y - POT_SHAFT_DY}
      />
      <Label text={p.label} x={at.x} y={at.y + 8} />
    </>
  )
}

function Selector({ p, x, y }: { p: Extract<Part, { t: "SEL" }>; x: number; y: number }) {
  const c: Conn = { pin1: p.com }
  p.throws.forEach((t, i) => (c[`pin${i + 2}`] = t))
  const unused = [...Array(7 - 1 - p.throws.length)].map((_, i) => `pin${p.throws.length + 2 + i}`)
  return (
    <>
      <A_2541WV_07P name={p.ref} connections={conns(c) as any} noConnect={unused as any} pcbX={x} pcbY={y} />
      <Label text={`${p.label}: C ${p.names.join(" ")}`} x={x} y={y + 5} size={1.1} />
    </>
  )
}

export default () => {
  const pots = design.filter((p): p is Extract<Part, { t: "POT" }> => p.t === "POT")
  const sel = (ref: string) => design.find((p) => p.ref === ref) as Extract<Part, { t: "SEL" }>
  return (
    <board width={`${W}mm`} height={`${H}mm`} borderRadius="3mm" title="NJD siren + filter"
      nominalTraceWidth="0.3mm" minTraceWidth="0.2mm">
      <Label text="SIREN" x={-W / 2 + 10} y={SIREN_Y + 12} size={2} />
      <Label text="FILTER" x={-W / 2 + 10} y={FILTER_Y + 12} size={2} />

      {pots.map((p) => <Knob key={p.ref} p={p} />)}

      {/* FIRE / LATCH / POWER on the filter row, right side */}
      <B3F_4055 name="SW1" connections={{ pin1: net("V12"), pin4: net("GATE") }} noConnect={["pin2", "pin3"]}
        pcbX={COLS[4]} pcbY={FILTER_Y} />
      <Label text="FIRE" x={COLS[4]} y={FILTER_Y + 9} />
      <ST_0_102_A01_T000_LF name="SW2" connections={{ pin2: net("V12"), pin1: net("GATE") }} noConnect={["pin3"]}
        pcbX={COLS[5]} pcbY={FILTER_Y} />
      <Label text="LATCH" x={COLS[5]} y={FILTER_Y + 8} />
      <ST_0_102_A01_T000_LF name="SW3" connections={{ pin2: net("VIN"), pin1: net("VSW") }} noConnect={["pin3"]}
        pcbX={COLS[6]} pcbY={FILTER_Y} />
      <Label text="POWER" x={COLS[6]} y={FILTER_Y + 8} />
      {/* JLCPCB LED/diode footprints: pin 1 = cathode */}
      <NCD0805R1 name="D2" connections={{ anode: net("LED_A"), cathode: net("GND") }} pcbX={COLS[6] + 9} pcbY={FILTER_Y + 2} />
      <resistor name="R90" resistance="4.7k" footprint="0603" connections={{ pin1: net("V12"), pin2: net("LED_A") }}
        pcbX={COLS[6] + 9} pcbY={FILTER_Y - 2} />
      {/* FIRE / LATCH / EXT FIRE pull GATE to 12 V */}
      <resistor name="R91" resistance="100k" footprint="0603" connections={{ pin1: net("GATE"), pin2: net("GND") }}
        pcbX={COLS[4] + 9} pcbY={FILTER_Y - 6} />

      {/* ===== power in: 12 V DC jack (pin1 = centre +), POWER toggle, reverse-polarity diode ===== */}
      <DC_005_2_5A_2_0 name="J1" connections={{ pin1: net("VIN"), pin2: net("GND"), pin3: net("GND") }}
        pcbX={-W / 2 + 15} pcbY={-H / 2 + 11} pcbRotation={90} />
      <Label text="12V DC" x={-W / 2 + 15} y={-H / 2 + 21} size={1.2} />
      <SS14 name="D1" connections={{ anode: net("VSW"), cathode: net("V12") }} pcbX={-W / 2 + 24} pcbY={-H / 2 + 8} />
      <capacitor name="C90" capacitance="22uF" footprint="0805" connections={{ pin1: net("V12"), pin2: net("GND") }}
        pcbX={-W / 2 + 31} pcbY={-H / 2 + 8} />
      <capacitor name="C91" capacitance="22uF" footprint="0805" connections={{ pin1: net("V12"), pin2: net("GND") }}
        pcbX={-W / 2 + 35} pcbY={-H / 2 + 8} />

      {/* ===== blocks of small parts ===== */}
      {(Object.keys(BLOCKS) as Group[]).map((g) => <Block key={g} group={g} />)}

      {/* ===== wire connectors on the bottom edge ===== */}
      <Selector p={sel("J4")} x={-20} y={-H / 2 + 7} />
      <Selector p={sel("J5")} x={8} y={-H / 2 + 7} />
      <HX25003_2A name="J2" connections={{ pin1: net("V12"), pin2: net("GATE") }} pcbX={36} pcbY={-H / 2 + 7} />
      <Label text="EXT FIRE" x={36} y={-H / 2 + 13} size={1.2} />
      <HX25003_2A name="J3" connections={{ pin1: net("OUT"), pin2: net("GND") }} pcbX={60} pcbY={-H / 2 + 7} />
      <Label text="OUT (tip, gnd)" x={60} y={-H / 2 + 13} size={1.2} />

      <copperpour connectsTo="net.GND" layer="bottom" clearance="0.3mm" />
      <hole name="H1" diameter="3.2mm" pcbX={-W / 2 + 4} pcbY={H / 2 - 4} />
      <hole name="H2" diameter="3.2mm" pcbX={W / 2 - 4} pcbY={H / 2 - 4} />
      <hole name="H3" diameter="3.2mm" pcbX={-W / 2 + 4} pcbY={-H / 2 + 4} />
      <hole name="H4" diameter="3.2mm" pcbX={W / 2 - 4} pcbY={-H / 2 + 4} />
    </board>
  )
}
