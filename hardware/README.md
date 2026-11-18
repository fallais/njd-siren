# NJD siren hardware

Analog version of the **Siren** and **Filter** units, in a 2U 19" rack case. Work in progress.

- `pcb/circuit/design.ts`: the circuit, described once.
- `pcb/circuit/boards.ts`: how it splits across the two boards, and the ribbon pinout.
- `pcb/`: the boards ([tscircuit](https://tscircuit.com)). `npm install && npm run dev`, then open http://localhost:3020. `npm run check` runs every check, `npm run fab` writes the Gerbers.
- `spice/`: simulation of the same circuit (ngspice). `bun tests.ts`.
- `panel/`: the 2U facade. `bun facade.ts` draws the layout of `pcb/circuit/panel.ts` as `facade.svg` (real size, mm; `#cut` and `#print` layers).

## Two boards

- **Front board** (`pcb/front.circuit.tsx`, 350 x 72 mm, 2 layers): right behind the facade, held by the pot and switch nuts. Pots, the two wave selectors, LATCH, POWER and the power LED, at the positions of `pcb/circuit/panel.ts`. The FIRE button (24 mm, panel-mount) is too deep for the board: it is wired to J8.
- **Main board** (`pcb/index.circuit.tsx`, 176 x 104 mm, 4 layers: top signals, GND plane, 12 V plane, bottom signals + ground pour): all the electronics, flat in the chassis against the rear panel. On the rear edge: the 12 V DC jack (J1) and OUT (J3), a Neutrik NRJ4HF 6.35 mm (1/4") mono jack whose threaded nose goes through the rear panel and is held by its nut (sleeve isolated from the panel).
- **Ribbon**: 50-way IDC, 2x25 2.54 mm box headers J6 (main) and J7 (front), straight through. Conductors are grouped by function with ground between groups (`RIBBON` in `boards.ts`).

Power: 12 V DC adapter (5.5/2.1 mm, centre positive). Vias 0.2/0.3 mm (JLCPCB multilayer minimum).

## To check on the real parts

- **Wave selectors**: Alps SRRM1C6200 (1 pole, 12 positions). The throw wired to each facade position assumes the knob pointer lines up with the rotor contact (`selectorThrowPin` in `boards.ts`); check with a meter and set the stop to 6 positions (LFO WAVE) and 4 (CARRIER) if the part has one. It is a shorting type: two shapes touch for an instant while turning.
- **Panel holes** (`HOLE` in `panel.ts`) against the bushings bought; pots, selectors and toggles must reach through the panel from the same board.
- **LATCH / POWER**: ON printed up, check which way the toggles close.
- **Power LED**: 0805 on the front board, needs a light pipe to the 3.2 mm hole.
- **Rear panel**: holes for the OUT jack nose (Neutrik drawing) and the DC jack, lined up with the main board's rear edge.
