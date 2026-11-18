/**
 * Draw the 2U facade from ../pcb/circuit/panel.ts.
 *
 *   bun facade.ts   -> facade.svg (real size, mm)
 *
 * SVG groups: #panel (plate), #print (silkscreen / engraving, white), #cut (outline, holes and
 * mounting slots, red hairline) so each can be exported on its own for the panel maker.
 */
import { BRAND, CONTROLS, HOLE, RACK, SECTIONS, type Control } from "../pcb/circuit/panel"

const W = RACK.width, H = RACK.height
const f = (n: number) => +n.toFixed(3)
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const FONT = `font-family="DejaVu Sans, Helvetica, Arial, sans-serif"`

const print: string[] = []
const cut: string[] = []

const text = (x: number, y: number, s: string, size: number, extra = "") =>
  print.push(`<text x="${f(x)}" y="${f(y)}" font-size="${size}" text-anchor="middle" ${extra}>${esc(s)}</text>`)
const line = (x1: number, y1: number, x2: number, y2: number, w = 0.3) =>
  print.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke-width="${w}" />`)
const hole = (x: number, y: number, d: number) => cut.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(d / 2)}" />`)
/** point at `deg` degrees clockwise from 12 o'clock */
const polar = (x: number, y: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [x + r * Math.sin(a), y - r * Math.cos(a)] as const
}

// ---------------------------------------------------------------- outline + rack slots
cut.push(`<rect x="0" y="0" width="${W}" height="${H}" rx="1" />`)
for (const sx of [-1, 1])
  for (const sy of [-1, 1]) {
    const cx = W / 2 + (sx * RACK.holePitchX) / 2, cy = H / 2 + (sy * RACK.holePitchY) / 2
    const { w, h } = RACK.slot
    cut.push(`<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${w}" height="${h}" rx="${h / 2}" />`)
  }

// ---------------------------------------------------------------- sections
for (const [i, s] of SECTIONS.entries()) {
  if (i > 0) line(s.x0, 4, s.x0, H - 4, 0.25)
  if (s.title) text((s.x0 + s.x1) / 2, 7, s.title, 3.4, `font-weight="bold" letter-spacing="1.2"`)
}

// ---------------------------------------------------------------- brand
text(BRAND.x, BRAND.y + 2, BRAND.title, 11, `font-weight="bold" letter-spacing="1"`)
text(BRAND.x, BRAND.y + 8, BRAND.subtitle, 2.4, `letter-spacing="0.6"`)

// ---------------------------------------------------------------- controls
const SWEEP = 150 // pots: ±150° of travel
const LABEL_DY = 19.5 // label baseline above the knob centre

function draw(c: Control) {
  switch (c.kind) {
    case "pot": {
      hole(c.x, c.y, HOLE.pot)
      for (let i = 0; i <= 10; i++) {
        const deg = -SWEEP + (i * 2 * SWEEP) / 10
        const major = i === 0 || i === 5 || i === 10
        const [x1, y1] = polar(c.x, c.y, 11.5, deg), [x2, y2] = polar(c.x, c.y, major ? 13.5 : 12.8, deg)
        line(x1, y1, x2, y2, major ? 0.45 : 0.3)
      }
      const [lx, ly] = polar(c.x, c.y, 15.5, -SWEEP), [rx, ry] = polar(c.x, c.y, 15.5, SWEEP)
      if (c.bipolar) {
        text(lx, ly + 1, "–", 2.6); text(rx, ry + 1, "+", 2.6)
      } else {
        text(lx, ly + 1, "0", 2); text(rx, ry + 1, "10", 2)
      }
      text(c.x, c.y - LABEL_DY, c.label, 2.8, `font-weight="bold"`)
      break
    }
    case "selector": {
      hole(c.x, c.y, HOLE.selector)
      const n = c.positions.length
      c.positions.forEach((name, i) => {
        const deg = (i - (n - 1) / 2) * 30 // 30° detents, stop set to n positions
        const [x1, y1] = polar(c.x, c.y, 11.5, deg), [x2, y2] = polar(c.x, c.y, 13.2, deg)
        line(x1, y1, x2, y2, 0.45)
        const [tx, ty] = polar(c.x, c.y, 16.2, deg)
        text(tx, ty + 0.7, name, 2)
      })
      text(c.x, c.y - LABEL_DY, c.label, 2.8, `font-weight="bold"`)
      break
    }
    case "button": {
      hole(c.x, c.y, HOLE.button)
      print.push(`<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(HOLE.button / 2 + 2.5)}" fill="none" stroke-width="0.5" />`)
      text(c.x, c.y - HOLE.button / 2 - 5, c.label, 4, `font-weight="bold" letter-spacing="1"`)
      break
    }
    case "toggle": {
      hole(c.x, c.y, HOLE.toggle)
      text(c.x, c.y - 9, c.label, 2.8, `font-weight="bold"`)
      text(c.x, c.y - 5, "ON", 1.8); text(c.x, c.y + 7, "OFF", 1.8)
      break
    }
    case "led":
      hole(c.x, c.y, HOLE.led)
      break
  }
}
CONTROLS.forEach(draw)

// ---------------------------------------------------------------- sanity: everything inside the clear width, no overlaps
const halfClear = RACK.clearWidth / 2
const size = (c: Control) => ({ pot: 13.5, selector: 20, button: HOLE.button / 2 + 2.5, toggle: 4, led: 2 })[c.kind]
for (const c of CONTROLS) {
  if (Math.abs(c.x - W / 2) + size(c) > halfClear) console.warn(`${c.ref} sticks out of the ${RACK.clearWidth} mm clear width`)
  if (c.y - size(c) < 3 || c.y + size(c) > H - 3) console.warn(`${c.ref} too close to the top / bottom edge`)
}
for (const [i, a] of CONTROLS.entries())
  for (const b of CONTROLS.slice(i + 1))
    if (Math.hypot(a.x - b.x, a.y - b.y) < (a.kind === "pot" ? 11 : size(a)) + (b.kind === "pot" ? 11 : size(b)))
      console.warn(`${a.ref} and ${b.ref} overlap`)

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- NJD siren 2U facade, generated by hardware/panel/facade.ts. Units: mm. -->
<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">
  <g id="panel"><rect x="0" y="0" width="${W}" height="${H}" rx="1" fill="#16181b" /></g>
  <g id="print" fill="#f2f2f2" stroke="#f2f2f2" ${FONT}>
    ${print.map((s) => (s.startsWith("<text") ? s.replace("<text ", '<text stroke="none" ') : s)).join("\n    ")}
  </g>
  <g id="cut" fill="#000" fill-opacity="0.85" stroke="#ff2a2a" stroke-width="0.1">
    ${cut.map((s, i) => (i === 0 ? s.replace("/>", 'fill="none" />') : s)).join("\n    ")}
  </g>
</svg>
`
const out = new URL("./facade.svg", import.meta.url).pathname
await Bun.write(out, svg)
console.log(`wrote ${out} (${CONTROLS.length} controls)`)

