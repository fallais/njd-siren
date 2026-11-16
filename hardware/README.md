# NJD siren hardware

Analog version of the **Siren** and **Filter** units, as a PCB. Work in progress.

- `pcb/circuit/design.ts`: the circuit, described once.
- `pcb/`: the board ([tscircuit](https://tscircuit.com)). `npm install && npm run dev`, then open http://localhost:3020.
- `spice/`: simulation of the same circuit (ngspice). `bun tests.ts`.

Power: 12 V DC adapter (5.5/2.1 mm, centre positive).

Two parts are not on the board: the **LFO WAVE** and **CARRIER** selectors are 1-pole 12-position rotary switches with an adjustable stop (Lorlin CK1049 or Alpha SR2611F), wired to the J4 and J5 connectors.
