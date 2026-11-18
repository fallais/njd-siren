/**
 * NJD siren: the 2U rack facade, described once.
 *
 * - ../../panel/facade.ts draws it (facade.svg).
 * - The front PCB (pots, selectors, FIRE, LATCH, POWER) places its parts from the same positions,
 *   so every shaft lines up with its hole.
 *
 * Panel coordinates in mm: origin at the top-left corner of the panel, x to the right, y down.
 * Knob and selector labels come from ./design.ts. Lives here (not in ../../panel) so the
 * tsci dev view, which only loads files inside hardware/pcb, can import it.
 */
import { design, type Part } from "./design"

/** EIA-310 19" panel, 2U */
export const RACK = {
  width: 482.6,
  height: 88.1, // 2 x 44.45 mm minus 0.8 mm clearance
  holePitchX: 465.1, // mounting slot centres, left to right
  holePitchY: 76.2, // mounting slot centres, top to bottom (outer holes of the two units)
  slot: { w: 10, h: 6.5 },
  /** controls and the front PCB stay inside this width (between the rack rails), centred */
  clearWidth: 430,
}

/** panel hole diameters, mm (check against the parts actually bought) */
export const HOLE = {
  pot: 7.5, // RK09K, M7 bushing
  selector: 10, // 12-position PCB rotary, 3/8" bushing
  button: 24, // large momentary pushbutton
  toggle: 6.2, // mini toggle, M6 bushing
  led: 3.2, // light pipe for the SMD power LED
}

export type Control = { ref: string; x: number; y: number; label: string } & (
  | { kind: "pot"; bipolar?: boolean }
  | { kind: "selector"; positions: string[] }
  | { kind: "button" }
  | { kind: "toggle" }
  | { kind: "led" }
)

const ROW1 = 32 // knob centres, top row
const ROW2 = 70 // knob centres, bottom row
const PITCH = 42

const pot = (ref: string) => design.find((p): p is Extract<Part, { t: "POT" }> => p.t === "POT" && p.ref === ref)!
const sel = (ref: string) => design.find((p): p is Extract<Part, { t: "SEL" }> => p.t === "SEL" && p.ref === ref)!
const knob = (ref: string, x: number, y: number, bipolar = false): Control => ({ kind: "pot", ref, x, y, label: pot(ref).label, bipolar })
const selector = (ref: string, x: number, y: number): Control => ({ kind: "selector", ref, x, y, label: sel(ref).label, positions: sel(ref).names })

/** column centre */
const col = (x0: number, i: number) => x0 + PITCH / 2 + i * PITCH

// left to right in signal order: name + power, SIREN, FILTER, OUTPUT
export const SECTIONS = [
  { title: "", x0: 26, x1: 84 },
  { title: "SIREN", x0: 84, x1: 84 + 4 * PITCH },
  { title: "FILTER", x0: 252, x1: 252 + 2 * PITCH },
  { title: "OUTPUT", x0: 336, x1: 456 },
]
const [B, S, F, O] = SECTIONS

export const CONTROLS: Control[] = [
  // SIREN: columns pair up vertically: pitch (TONE / SWEEP), shapes + envelope, LFO (SPEED / DEPTH)
  knob("RV1", col(S.x0, 0), ROW1), // TONE
  selector("J5", col(S.x0, 1), ROW1), // CARRIER
  selector("J4", col(S.x0, 2), ROW1), // LFO WAVE
  knob("RV2", col(S.x0, 3), ROW1), // SPEED
  knob("RV4", col(S.x0, 0), ROW2, true), // SWEEP (down .. up)
  knob("RV5", col(S.x0, 1), ROW2), // GLIDE
  knob("RV6", col(S.x0, 2), ROW2), // RELEASE
  knob("RV3", col(S.x0, 3), ROW2), // DEPTH
  // FILTER
  knob("RV9", col(F.x0, 0), ROW1), // CUTOFF
  knob("RV10", col(F.x0, 1), ROW1), // RESONANCE
  knob("RV8", col(F.x0, 0), ROW2), // DRIVE
  knob("RV11", col(F.x0, 1), ROW2), // LFO > CUTOFF
  // OUTPUT: level, latch, and the big FIRE button
  knob("RV7", col(O.x0, 0), ROW1), // VOLUME
  { kind: "toggle", ref: "SW2", x: col(O.x0, 0), y: ROW2, label: "LATCH" },
  { kind: "button", ref: "SW1", x: O.x0 + 84, y: (ROW1 + ROW2) / 2 + 3, label: "FIRE" },
  // power
  { kind: "toggle", ref: "SW3", x: B.x0 + 20, y: ROW2, label: "POWER" },
  { kind: "led", ref: "D2", x: B.x0 + 38, y: ROW2, label: "" },
]

export const BRAND = { title: "NJD", subtitle: "SIREN + FILTER", x: (B.x0 + B.x1) / 2, y: ROW1 }
