/**
 * 2x25 shrouded box header, 2.54 mm, IDC numbering (odd pins on one row, even on the other, so
 * ribbon conductor n = pin n). Hand-written: the footprinter's pinrow numbers pins around the outside.
 * Pin 1 top-left; key notch on the pin-1 row side, centred.
 */
import type { ChipProps } from "@tscircuit/props"

const N = 50
const P = 2.54
const pinLabels = Object.fromEntries([...Array(N)].map((_, i) => [`pin${i + 1}`, [`pin${i + 1}`]])) as Record<string, string[]>
const pos = (n: number) => ({ x: (Math.floor((n - 1) / 2) - (N / 2 - 1) / 2) * P, y: (n - 1) % 2 === 0 ? P / 2 : -P / 2 })

// shroud: 2.54 * 25 + 5.1 long, 8.9 mm wide
const L = (N / 2) * P + 5.1, Wd = 8.9

export const IDC_2x25 = (props: ChipProps<any>) => (
  <chip
    pinLabels={pinLabels as any}
    manufacturerPartNumber="2x25 box header 2.54mm"
    footprint={
      <footprint insertionDirection="from_above">
        {[...Array(N)].map((_, i) => {
          const { x, y } = pos(i + 1)
          return <platedhole {...({ key: i } as {})} portHints={[`pin${i + 1}`]} pcbX={`${x}mm`} pcbY={`${y}mm`} outerDiameter="1.6mm" holeDiameter="1.0mm" shape="circle" />
        })}
        <silkscreenpath route={[{ x: -L / 2, y: Wd / 2 }, { x: -2.5, y: Wd / 2 }, { x: -2.5, y: Wd / 2 - 1 }, { x: 2.5, y: Wd / 2 - 1 }, { x: 2.5, y: Wd / 2 }, { x: L / 2, y: Wd / 2 }, { x: L / 2, y: -Wd / 2 }, { x: -L / 2, y: -Wd / 2 }, { x: -L / 2, y: Wd / 2 }]} />
        {/* pin 1 marker */}
        <silkscreenpath route={[{ x: pos(1).x - 1.6, y: Wd / 2 + 0.6 }, { x: pos(1).x + 1.6, y: Wd / 2 + 0.6 }]} />
        <silkscreentext text="1" pcbX={`${pos(1).x - 2.6}mm`} pcbY={`${Wd / 2 + 1.2}mm`} fontSize="1mm" />
        <silkscreentext text="{NAME}" pcbX="0mm" pcbY={`${-Wd / 2 - 1.2}mm`} anchorAlignment="center" fontSize="1mm" />
        <courtyardoutline outline={[{ x: -L / 2 - 0.25, y: Wd / 2 + 0.25 }, { x: L / 2 + 0.25, y: Wd / 2 + 0.25 }, { x: L / 2 + 0.25, y: -Wd / 2 - 0.25 }, { x: -L / 2 - 0.25, y: -Wd / 2 - 0.25 }, { x: -L / 2 - 0.25, y: Wd / 2 + 0.25 }]} />
      </footprint>
    }
    {...props}
  />
)
