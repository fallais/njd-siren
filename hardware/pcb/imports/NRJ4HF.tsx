/**
 * Neutrik NRJ4HF: 6.35 mm (1/4") MONO jack, horizontal PCB mount, switched, fully threaded nose
 * (goes through the panel, held by its nut), sleeve isolated from the panel.
 * https://www.neutrik.com/en/product/nrj4hf
 *
 * Converted from the KiCad library footprint Jack_6.35mm_Neutrik_NRJ4HF_Horizontal (KiCad y points
 * down, tscircuit y up: mirrored accordingly). Origin: centre of the body face where the nose starts;
 * the nose points to +x, 8.9 mm long. Put the origin on the board edge, nose outside.
 *
 * Pins: T = tip, S = sleeve, TN / SN = tip / sleeve switch contacts (closed with no plug).
 */
import type { ChipProps } from "@tscircuit/props"

const pinLabels = { pin1: ["T"], pin2: ["S"], pin3: ["TN"], pin4: ["SN"] } as const

// KiCad footprint coordinates -> ours: face at KiCad x = 17.07, nose axis at KiCad y = 7.23
const u = (x: number) => x - 17.07
const v = (y: number) => 7.23 - y
const mm = (n: number) => `${+n.toFixed(3)}mm`

const pads: [string, number, number][] = [["pin1", 0, 0], ["pin2", 12.7, 0], ["pin3", 0, 11.43], ["pin4", 12.7, 11.43]]
const pegs: [number, number, number][] = [[3.15, 2.13, 3], [9.5, 0, 2], [9.5, 11.43, 2]] // non-plated locating holes

const body = [{ x: u(-7.47), y: v(-2.21) }, { x: 0, y: v(-2.21) }, { x: 0, y: v(13.78) }, { x: u(-7.47), y: v(13.78) }, { x: u(-7.47), y: v(-2.21) }]
const nose = [{ x: 0, y: 5.62 }, { x: 8.9, y: 5.62 }, { x: 8.9, y: -5.62 }, { x: 0, y: -5.62 }]

export const NRJ4HF = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    manufacturerPartNumber="NRJ4HF"
    footprint={
      <footprint insertionDirection="from_x_pos">
        {pads.map(([name, x, y]) => (
          <platedhole {...({ key: name } as {})} portHints={[name]} pcbX={mm(u(x))} pcbY={mm(v(y))} outerDiameter="3mm" holeDiameter="1.5mm" shape="circle" />
        ))}
        {pegs.map(([x, y, d], i) => <hole {...({ key: i } as {})} pcbX={mm(u(x))} pcbY={mm(v(y))} diameter={mm(d)} />)}
        <silkscreenpath route={body} />
        <fabricationnotepath route={nose} />
        <silkscreentext text="{NAME}" pcbX={mm(u(5))} pcbY={mm(v(5.7))} fontSize="1mm" />
        <courtyardoutline outline={[{ x: u(-7.85), y: v(-2.59) }, { x: 0.1, y: v(-2.59) }, { x: 0.1, y: v(14.16) }, { x: u(-7.85), y: v(14.16) }, { x: u(-7.85), y: v(-2.59) }]} />
      </footprint>
    }
    {...props}
  />
)
