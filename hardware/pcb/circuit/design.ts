/**
 * NJD siren + filter: the ONE description of the circuit.
 *
 * - ../../spice/sim.ts turns it into an ngspice netlist (behavioural models) to check every block.
 * - ../index.circuit.tsx turns it into the tscircuit board.
 *
 * 12 V DC in, VREF = 6 V (buffered). Nets are plain strings; "GND", "V12", "VREF" are the rails.
 * Pots: `ccw` is the end the wiper sits on when the knob is fully counter-clockwise.
 */

export type Knob =
  | "tone" | "speed" | "depth" | "sweep" | "glide" | "release" | "volume"
  | "drive" | "cutoff" | "resonance" | "lfoCutoff"

export type Group = "power" | "lfo" | "lfo2" | "env" | "vco" | "vca" | "filter" | "out"

type Base = { ref: string; group: Group; note?: string }
export type Part = Base & (
  | { t: "R"; value: number; a: string; b: string }
  | { t: "C"; value: number; a: string; b: string; size?: "0603" | "0805" | "elec"; ic?: number }
  | { t: "D"; anode: string; cathode: string } // 1N4148WS
  | { t: "POT"; value: 10e3; ccw: string; wiper: string; cw?: string; knob: Knob; label: string }
  | { t: "OPA"; pkg: string; section: "A" | "B" | "C" | "D"; p: string; m: string; o: string }
  | { t: "OTA"; pkg: string; section: "A" | "B"; p: string; m: string; o: string; abc: string }
  | { t: "SW"; io1: string; io2: string; ctl: string } // TC4S66F
  | { t: "SEL"; label: string; com: string; throws: [string, ...string[]]; names: string[] } // off-board rotary switch
)

export const RAILS = { GND: "GND", V12: "V12", VREF: "VREF" } as const

const parts: Part[] = []
const R = (group: Group, ref: string, value: number, a: string, b: string, note?: string) => parts.push({ t: "R", group, ref, value, a, b, note })
const C = (group: Group, ref: string, value: number, a: string, b: string, extra: { size?: "0603" | "0805" | "elec"; ic?: number } = {}) =>
  parts.push({ t: "C", group, ref, value, a, b, ...extra })
const D = (group: Group, ref: string, anode: string, cathode: string) => parts.push({ t: "D", group, ref, anode, cathode })
const OPA = (group: Group, pkg: string, section: "A" | "B" | "C" | "D", p: string, m: string, o: string, note?: string) =>
  parts.push({ t: "OPA", group, ref: `${pkg}${section}`, pkg, section, p, m, o, note })
const OTA = (group: Group, pkg: string, section: "A" | "B", p: string, m: string, o: string, abc: string) =>
  parts.push({ t: "OTA", group, ref: `${pkg}${section}`, pkg, section, p, m, o, abc })
const POT = (group: Group, ref: string, knob: Knob, label: string, value: 10e3, ccw: string, wiper: string, cw?: string) =>
  parts.push({ t: "POT", group, ref, knob, label, value, ccw, wiper, cw })
const SW = (group: Group, ref: string, io1: string, io2: string, ctl: string) => parts.push({ t: "SW", group, ref, io1, io2, ctl })

// ---------------------------------------------------------------- power / reference
R("power", "R1", 10e3, "V12", "VR_DIV")
R("power", "R2", 10e3, "VR_DIV", "GND")
C("power", "C1", 10e-6, "VR_DIV", "GND", { size: "0805", ic: 6 })
OPA("power", "U1", "A", "VR_DIV", "VREF", "VREF", "6 V reference buffer")
C("power", "C2", 10e-6, "VREF", "GND", { size: "0805", ic: 6 })

// ---------------------------------------------------------------- LFO core: Schmitt trigger + integrator
OPA("lfo", "U1", "B", "HYST", "VREF", "SQ")
R("lfo", "R3", 10e3, "TRI", "HYST")
R("lfo", "R4", 22e3, "SQ", "HYST")
POT("lfo", "RV2", "speed", "SPEED", 10e3, "SPD_LO", "SPD_W", "SQ")
R("lfo", "R5", 470, "SPD_LO", "VREF")
R("lfo", "R6", 22e3, "SPD_W", "INTG")
C("lfo", "C3", 1e-6, "INTG", "TRI", { ic: 0 })
OPA("lfo", "U1", "C", "VREF", "INTG", "TRI")
// square, scaled to the triangle's ±2.7 V
R("lfo", "R7", 12e3, "SQ", "SQR")
R("lfo", "R8", 10e3, "SQR", "VREF")
// sine: triangle halved (10k/10k), rounded by two diodes each way (1.4 % THD), then x2.8
R("lfo", "R9", 10e3, "TRI", "SNN")
R("lfo", "R73", 10e3, "SNN", "VREF")
D("lfo", "D3", "SNN", "SN1"); D("lfo", "D4", "SN1", "VREF")
D("lfo", "D5", "VREF", "SN2"); D("lfo", "D6", "SN2", "SNN")
OPA("lfo", "U1", "D", "SNN", "SNF", "SINE")
R("lfo", "R10", 10e3, "SNF", "VREF")
R("lfo", "R11", 18e3, "SINE", "SNF")
// saw: the triangle folded (gain +1 or -1 depending on the square) runs at twice the LFO
// rate; adding the square, scaled to the triangle peak, joins the two halves into one ramp
// at the LFO rate: SAW = (FOLD + SQR) / 2. The 10k/22k ratio (= R3/R4) cancels the
// mid-period step; R77 only sets the level (±2.7 V into the 1M selector load).
R("lfo2", "R12", 10e3, "TRI", "SWM")
R("lfo2", "R13", 10e3, "FOLD", "SWM")
R("lfo2", "R14", 10e3, "TRI", "SWP")
SW("lfo2", "U9", "SWP", "VREF", "SQ")
OPA("lfo2", "U2", "A", "SWP", "SWM", "FOLD")
R("lfo2", "R75", 10e3, "FOLD", "SAW")
R("lfo2", "R76", 22e3, "SQ", "SAW")
R("lfo2", "R77", 18e3, "SAW", "VREF")
// ramp down: -(FOLD + SQR) / 2, same 10k/22k ratio
R("lfo2", "R15", 10e3, "FOLD", "RMM")
R("lfo2", "R78", 22e3, "SQ", "RMM")
R("lfo2", "R16", 5.1e3, "RAMP", "RMM")
OPA("lfo2", "U2", "B", "VREF", "RMM", "RAMP")
// random steps: sample the carrier triangle on every rising edge of the LFO square
C("lfo2", "C4", 1e-9, "SQ", "RDP")
R("lfo2", "R17", 100e3, "RDP", "GND")
SW("lfo2", "U10", "TRI_C", "RDH", "RDP")
C("lfo2", "C5", 100e-9, "RDH", "VREF")
OPA("lfo2", "U2", "C", "RDH", "RND", "RND")
// LFO WAVE selector (panel rotary switch) + buffer
parts.push({ t: "SEL", group: "lfo2", ref: "J4", label: "LFO WAVE", com: "LSEL",
  throws: ["SINE", "TRI", "SQR", "SAW", "RAMP", "RND"], names: ["sine", "tri", "sqr", "saw", "ramp", "rnd"] })
R("lfo2", "R18", 1e6, "LSEL", "VREF")
OPA("lfo2", "U2", "D", "LSEL", "LFO", "LFO")

// ---------------------------------------------------------------- envelopes
// release: fast charge while GATE is high; once it drops, discharge through the RELEASE pot
// into the buffered gate (the diode blocks that path while the note is held)
D("env", "D7", "GATE", "EN1")
R("env", "R19", 100, "EN1", "ENV")
C("env", "C6", 100e-6, "ENV", "GND", { size: "elec", ic: 0 }) // + to ENV
R("env", "R20", 330, "ENV", "REL1")
POT("env", "RV6", "release", "RELEASE", 10e3, "REL1", "REL2")
D("env", "D17", "REL2", "GATEB")
OPA("env", "U3", "A", "ENV", "ENVB", "ENVB")
// sweep: GATE step (4 V) high-passed by the GLIDE pot, bipolar SWEEP pot
R("env", "R21", 22e3, "GATE", "GS")
R("env", "R22", 10e3, "GS", "GND")
OPA("env", "U3", "B", "GS", "GSB", "GSB")
C("env", "C7", 100e-6, "GL", "GSB", { size: "elec", ic: 0 }) // + to GL (GL sits above GSB)
R("env", "R23", 470, "GL", "GL1")
POT("env", "RV5", "glide", "GLIDE", 10e3, "GL1", "VREF")
D("env", "D8", "VREF", "GL")
R("env", "R24", 10e3, "GL", "GLM")
R("env", "R25", 10e3, "GLI", "GLM")
OPA("env", "U3", "C", "VREF", "GLM", "GLI")
POT("env", "RV4", "sweep", "SWEEP", 10e3, "GLI", "SWPW", "GL")

// ---------------------------------------------------------------- VCO: CV summer + OTA triangle core
R("vco", "R26", 2.2e3, "V12", "TONE_T")
POT("vco", "RV1", "tone", "TONE", 10e3, "TONE_T", "TONE_W", "TONE_B")
R("vco", "R27", 2.2e3, "TONE_B", "GND")
POT("vco", "RV3", "depth", "DEPTH", 10e3, "VREF", "DEP_W", "LFO")
R("vco", "R28", 18e3, "TONE_W", "CVM")
R("vco", "R29", 22e3, "DEP_W", "CVM")
R("vco", "R30", 33e3, "SWPW", "CVM")
R("vco", "R31", 22e3, "CV", "CVM")
OPA("vco", "U3", "D", "VREF", "CVM", "CV")
R("vco", "R32", 68e3, "CV", "ABC1")
R("vco", "R33", 2.2e6, "V12", "ABC1")
OTA("vco", "U7", "A", "VREF", "OSCP", "TRIC", "ABC1")
C("vco", "C8", 4.7e-9, "TRIC", "VREF", { ic: 0 })
OPA("vco", "U4", "A", "TRIC", "TRI_C", "TRI_C")
R("vco", "R34", 10e3, "TRI_C", "HYSC")
R("vco", "R35", 22e3, "SQ_C", "HYSC")
OPA("vco", "U4", "B", "HYSC", "VREF", "SQ_C")
R("vco", "R36", 47e3, "SQ_C", "OSCP")
R("vco", "R37", 1e3, "OSCP", "VREF")
// carrier shapes
R("vco", "R38", 12e3, "SQ_C", "SQR_C")
R("vco", "R39", 10e3, "SQR_C", "VREF")
R("vco", "R40", 10e3, "TRI_C", "CSNN")
R("vco", "R74", 10e3, "CSNN", "VREF")
D("vco", "D9", "CSNN", "CS1"); D("vco", "D10", "CS1", "VREF")
D("vco", "D11", "VREF", "CS2"); D("vco", "D12", "CS2", "CSNN")
OPA("vco", "U4", "D", "CSNN", "CSNF", "SINE_C")
R("vco", "R41", 10e3, "CSNF", "VREF")
R("vco", "R42", 18e3, "SINE_C", "CSNF")
// saw: folded triangle + square, as for the LFO (otherwise it plays an octave up);
// R81 sets the level into the 48k VCA input
R("vco", "R43", 10e3, "TRI_C", "CSWM")
R("vco", "R44", 10e3, "FOLD_C", "CSWM")
R("vco", "R45", 10e3, "TRI_C", "CSWP")
SW("vco", "U11", "CSWP", "VREF", "SQ_C")
OPA("vco", "U4", "C", "CSWP", "CSWM", "FOLD_C")
R("vco", "R79", 10e3, "FOLD_C", "SAW_C")
R("vco", "R80", 22e3, "SQ_C", "SAW_C")
R("vco", "R81", 30e3, "SAW_C", "VREF")
parts.push({ t: "SEL", group: "vco", ref: "J5", label: "CARRIER", com: "CAR",
  throws: ["SINE_C", "SQR_C", "SAW_C", "TRI_C"], names: ["sine", "sqr", "saw", "tri"] })
R("vco", "R46", 1e6, "CAR", "VREF")

// ---------------------------------------------------------------- VCA
R("vca", "R47", 47e3, "CAR", "VCAP")
R("vca", "R48", 1e3, "VCAP", "VREF")
R("vca", "R49", 1e3, "VCAM", "VREF")
R("vca", "R50", 47e3, "ENVB", "ABC2")
OTA("vca", "U7", "B", "VCAP", "VCAM", "VCAO", "ABC2")
R("vca", "R51", 3.3e3, "VCAO", "VREF")
OPA("vca", "U5", "A", "VCAO", "VCA", "VCA")

// ---------------------------------------------------------------- Filter: drive + soft clip + 2-pole OTA low-pass
R("filter", "R52", 1e3, "DRM", "VREF")
R("filter", "R53", 1e3, "DRM", "DRF1")
POT("filter", "RV8", "drive", "DRIVE", 10e3, "DRF1", "DRV")
OPA("filter", "U5", "B", "VCA", "DRM", "DRV")
R("filter", "R54", 2.2e3, "DRV", "CLP")
D("filter", "D13", "CLP", "CK1"); D("filter", "D14", "CK1", "VREF")
D("filter", "D15", "VREF", "CK2"); D("filter", "D16", "CK2", "CLP")
// cutoff CV: quasi-log cutoff pot + LFO amount, summed and re-inverted
POT("filter", "RV9", "cutoff", "CUTOFF", 10e3, "GND", "CUT_W", "V12")
R("filter", "R55", 1.5e3, "CUT_W", "GND")
POT("filter", "RV11", "lfoCutoff", "LFO > CUTOFF", 10e3, "VREF", "LCT_W", "LFO")
R("filter", "R56", 22e3, "CUT_W", "FCM")
R("filter", "R57", 22e3, "LCT_W", "FCM")
R("filter", "R58", 22e3, "FCV0", "FCM")
OPA("filter", "U5", "C", "VREF", "FCM", "FCV0")
R("filter", "R59", 10e3, "FCV0", "FIM")
R("filter", "R60", 10e3, "FCV", "FIM")
OPA("filter", "U5", "D", "VREF", "FIM", "FCV")
R("filter", "R61", 22e3, "FCV", "FABC1")
R("filter", "R62", 22e3, "FCV", "FABC2")
// stage 1
R("filter", "R63", 22e3, "CLP", "F1P")
R("filter", "R64", 220, "F1P", "VREF")
R("filter", "R65", 22e3, "FOUT", "F1M")
R("filter", "R66", 220, "F1M", "VREF")
OTA("filter", "U8", "A", "F1P", "F1M", "F1O", "FABC1")
C("filter", "C9", 1e-9, "F1O", "VREF", { ic: 0 })
OPA("filter", "U6", "A", "F1O", "V1", "V1")
// stage 2, damping set by RESONANCE
R("filter", "R67", 22e3, "V1", "F2P")
R("filter", "R68", 220, "F2P", "VREF")
R("filter", "R69", 1.2e3, "FOUT", "RES_T")
POT("filter", "RV10", "resonance", "RESONANCE", 10e3, "RES_T", "RES_W", "VREF")
R("filter", "R70", 22e3, "RES_W", "F2M")
R("filter", "R71", 220, "F2M", "VREF")
OTA("filter", "U8", "B", "F2P", "F2M", "F2O", "FABC2")
C("filter", "C10", 1e-9, "F2O", "VREF", { ic: 0 })
OPA("filter", "U6", "B", "F2O", "FOUT", "FOUT")
// spare op-amp sections: followers of VREF
OPA("env", "U6", "C", "GATE", "GATEB", "GATEB") // gate buffer for the release path
OPA("filter", "U6", "D", "VREF", "SPARE_D", "SPARE_D")

// ---------------------------------------------------------------- output
POT("out", "RV7", "volume", "VOLUME", 10e3, "GND", "VOL_W", "FOUT")
C("out", "C11", 1e-6, "VOL_W", "OUT")
R("out", "R72", 100e3, "OUT", "GND")

export const design = parts

/** Op-amp / OTA / switch packages and their power pins (for the PCB). */
export const packages = {
  opamp: ["U1", "U2", "U3", "U4", "U5", "U6"], // TLC2274 quad
  ota: ["U7", "U8"], // LM13700 dual
  switch: ["U9", "U10", "U11"], // TC4S66F
}
