/**
 * NJD siren: the FRONT board, right behind the 2U facade.
 *
 * Pots, wave selectors, LATCH, POWER and the power LED sit on the top side (facing the panel),
 * at the positions of ../panel/panel.ts. The FIRE button is panel-mounted (too deep for the board):
 * it is wired to J8. The ribbon header J7 is on the back side and goes to J6 on the main board.
 * 2 layers. Coordinates: the board centre is at (CX, CY) in panel coordinates (x right, y down).
 */
import { design, type Part } from "./circuit/design"
import { isFront, RIBBON, SELECTOR_COMMON_PIN, selectorThrowPin } from "./circuit/boards"
import { CONTROLS } from "../panel/panel"

import { RK09K1130A70 } from "./imports/RK09K1130A70" // C351173 9 mm pot, 10k linear
import { SRRM1C6200 } from "./imports/SRRM1C6200" // C278333 1 pole 12 positions rotary
import { ST_0_102_A01_T000_LF } from "./imports/ST_0_102_A01_T000_LF" // C1788487 mini toggle SPDT
import { HX25003_2A } from "./imports/HX25003_2A" // C442299 2-pin XH (FIRE button wires)
import { NCD0805R1 } from "./imports/NCD0805R1" // C84256 red LED
import { IDC_2x25 } from "./imports/IDC_2x25"

const net = (n: string) => `net.${n}`

// board outline in panel coordinates: from POWER to VOLUME / LATCH, FIRE stays off the board
const X0 = 30, X1 = 380, Y0 = 10, Y1 = 82
const W = X1 - X0, H = Y1 - Y0
const CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2
const bx = (x: number) => x - CX
const by = (y: number) => CY - y

const POT_SHAFT_DY = 3.9 // RK09K: shaft centre is 3.9 mm above the footprint origin
const at = (ref: string) => {
  const c = CONTROLS.find((c) => c.ref === ref)
  if (!c) throw new Error(`${ref} is not on the facade`)
  return c
}

function Pot({ p }: { p: Extract<Part, { t: "POT" }> }) {
  const c = at(p.ref)
  // a rheostat leaves the CW end free: tie it to the wiper
  return (
    <RK09K1130A70 name={p.ref}
      connections={{ pin1: net(p.ccw), pin2: net(p.wiper), pin3: net(p.cw ?? p.wiper), EH1: net("GND"), EH2: net("GND") }}
      pcbX={bx(c.x)} pcbY={by(c.y) - POT_SHAFT_DY} />
  )
}

function Selector({ p }: { p: Extract<Part, { t: "SEL" }> }) {
  const c = at(p.ref)
  const conn: Record<string, string> = { [`pin${SELECTOR_COMMON_PIN}`]: net(p.com) }
  p.throws.forEach((t, i) => (conn[`pin${selectorThrowPin(i, p.throws.length)}`] = net(t)))
  const unused = [...Array(12)].map((_, i) => `pin${i + 1}`).filter((k) => !conn[k])
  return <SRRM1C6200 name={p.ref} connections={conn as any} noConnect={unused as any} pcbX={bx(c.x)} pcbY={by(c.y)} />
}

export default () => {
  const ribbon = Object.fromEntries(RIBBON.map((n, i) => [`pin${i + 1}`, net(n)]))
  const latch = at("SW2"), power = at("SW3"), led = at("D2"), fire = at("SW1")
  return (
    <board width={`${W}mm`} height={`${H}mm`} borderRadius="2mm" title="NJD siren front"
      nominalTraceWidth="0.3mm" minTraceWidth="0.2mm" routeRemaining>
      {design.filter(isFront).map((p) =>
        p.t === "POT" ? <Pot key={p.ref} p={p} /> : p.t === "SEL" ? <Selector key={p.ref} p={p} /> : null)}

      {/* LATCH holds GATE at 12 V, POWER switches the DC input (VIN -> VSW, both via the ribbon) */}
      <ST_0_102_A01_T000_LF name="SW2" connections={{ pin2: net("V12"), pin1: net("GATE") }} noConnect={["pin3"]}
        pcbX={bx(latch.x)} pcbY={by(latch.y)} />
      <ST_0_102_A01_T000_LF name="SW3" connections={{ pin2: net("VIN"), pin1: net("VSW") }} noConnect={["pin3"]}
        pcbX={bx(power.x)} pcbY={by(power.y)} />
      {/* power LED under its light pipe (JLCPCB LED footprint: pin 1 = cathode) */}
      <NCD0805R1 name="D2" connections={{ anode: net("LED_A"), cathode: net("GND") }} pcbX={bx(led.x)} pcbY={by(led.y)} />
      <resistor name="R90" resistance="4.7k" footprint="0603" connections={{ pin1: net("V12"), pin2: net("LED_A") }}
        pcbX={bx(led.x)} pcbY={by(led.y) - 4} />

      {/* FIRE: panel-mount momentary, wired here (pin 1 = 12 V, pin 2 = GATE) */}
      <HX25003_2A name="J8" connections={{ pin1: net("V12"), pin2: net("GATE") }} pcbX={bx(X1 - 7)} pcbY={by(fire.y)} pcbRotation={90} />
      <silkscreentext text="FIRE" pcbX={bx(X1 - 7)} pcbY={by(fire.y) + 6} fontSize="1.2mm" />

      {/* ribbon to the main board, on the back side */}
      <IDC_2x25 name="J7" connections={ribbon as any} layer="bottom" pcbX={bx(200)} pcbY={by(52)} />

      <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
      <copperpour connectsTo="net.GND" layer="bottom" clearance="0.3mm" />
    </board>
  )
}

