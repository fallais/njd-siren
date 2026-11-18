/**
 * NJD siren: how the circuit splits across the two boards.
 *
 * - front board (front.circuit.tsx): everything on the facade (pots, wave selectors, LATCH,
 *   POWER, power LED) plus a header for the panel-mount FIRE button. Placed from ./panel.ts.
 * - main board (index.circuit.tsx): all the electronics, power input and output on the rear edge.
 *
 * The two are joined by a 50-way IDC ribbon (2x25, 2.54 mm, straight through: pin n to pin n).
 */
import { design, type Part } from "./design"

/** the design parts that live on the front board */
export const isFront = (p: Part) => p.t === "POT" || p.t === "SEL"

/** board-only parts (not in design.ts) and the nets they use */
export const FRONT_EXTRA_NETS = ["V12", "GATE", "VIN", "VSW", "GND"] // FIRE, LATCH, POWER, LED
export const MAIN_EXTRA_NETS = ["V12", "GATE", "VIN", "VSW", "GND", "OUT"] // GATE pull-down, DC jack, OUT

/**
 * Ribbon conductors, pin 1 first. Grouped by function, low-impedance grounds between groups so
 * the LFO / carrier lines do not couple into the pitch CV or the output.
 */
export const RIBBON = [
  "VIN", "VSW", "GND", "V12", "VREF", "GND",
  // pitch: TONE, DEPTH, SWEEP / GLIDE
  "TONE_T", "TONE_W", "TONE_B", "DEP_W", "GND", "GLI", "SWPW", "GL", "GL1", "GND",
  // envelope, gate, LFO speed
  "REL1", "REL2", "GATE", "SPD_LO", "SPD_W", "GND",
  // LFO wave selector
  "SQ", "LFO", "LSEL", "GND", "SINE", "TRI", "SQR", "GND", "SAW", "RAMP", "RND", "GND",
  // carrier selector
  "CAR", "SINE_C", "SQR_C", "GND", "SAW_C", "TRI_C", "GND",
  // filter
  "CUT_W", "LCT_W", "RES_T", "RES_W", "DRF1", "DRV", "GND",
  // output level
  "FOUT", "VOL_W",
]

/** nets of a design part */
export const partNets = (p: Part): string[] =>
  p.t === "POT" ? [p.ccw, p.wiper, p.cw ?? p.wiper, "GND"]
  : p.t === "SEL" ? [p.com, ...p.throws]
  : p.t === "R" || p.t === "C" ? [p.a, p.b]
  : p.t === "D" ? [p.anode, p.cathode]
  : p.t === "OPA" ? [p.p, p.m, p.o, "V12", "GND"]
  : p.t === "OTA" ? [p.p, p.m, p.o, p.abc, "V12", "GND"]
  : [p.io1, p.io2, p.ctl, "V12", "GND"]

// the ribbon must carry exactly the nets used on both boards
{
  const front = new Set(FRONT_EXTRA_NETS), main = new Set(MAIN_EXTRA_NETS)
  for (const p of design) for (const n of partNets(p)) (isFront(p) ? front : main).add(n)
  const crossing = [...front].filter((n) => main.has(n))
  const missing = crossing.filter((n) => !RIBBON.includes(n))
  const extra = RIBBON.filter((n) => !crossing.includes(n))
  if (RIBBON.length !== 50 || missing.length || extra.length)
    throw new Error(`ribbon: ${RIBBON.length}/50 pins, missing [${missing}], not needed [${extra}]`)
}

/**
 * Wave selectors: Alps SRRM1C6200 (1 pole, 12 positions, 30 degrees). Throw pin k sits at
 * 15 + 30 (k - 1) degrees (counter-clockwise from 3 o'clock, seen from the front), pin 13 is the
 * common. Facade position i of n (left to right, 30 degree steps centred on 12 o'clock) is the
 * throw under the knob pointer. CHECK on the real part that the pointer and the rotor contact agree.
 */
export const SELECTOR_COMMON_PIN = 13
export const selectorThrowPin = (i: number, n: number) => {
  const deg = (i - (n - 1) / 2) * 30 // clockwise from 12 o'clock
  return Math.round((75 - deg) / 30) + 1
}
