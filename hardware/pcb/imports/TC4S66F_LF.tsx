import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN2","OUT2"],
  pin2: ["OUT1","IN1"],
  pin3: ["VSS"],
  pin4: ["CONT"],
  pin5: ["VDD"]
} as const

const pinAttributes = {
  pin3: {requiresGround: true},
  pin5: {requiresPower: true}
} as const

export const TC4S66F_LF = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C146314"
  ]
}}
      manufacturerPartNumber="TC4S66F,LF"
      footprint={<footprint>
        <smtpad portHints={["pin4"]} pcbX="1.35001mm" pcbY="-0.94996mm" width="1.1999976mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="1.35001mm" pcbY="0.94996mm" width="1.1999976mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-1.35001mm" pcbY="-0.94996mm" width="1.1999976mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-1.35001mm" pcbY="0mm" width="1.1999976mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-1.35001mm" pcbY="0.94996mm" width="1.1999976mm" height="0.499999mm" shape="rect" />
<silkscreenpath route={[{"x":-0.7874000000000478,"y":1.4477999999999156},{"x":0.7873999999999342,"y":1.4477999999999156}]} />
<silkscreenpath route={[{"x":0.7873999999999342,"y":-1.4477999999999156},{"x":-0.7874000000000478,"y":-1.4477999999999156}]} />
<silkscreenpath route={[{"x":0.7873999999999342,"y":1.4477999999999156},{"x":0.7873999999999342,"y":1.4208760000001348}]} />
<silkscreenpath route={[{"x":0.7873999999999342,"y":0.4588002000000415},{"x":0.7873999999999342,"y":-0.45872399999996105}]} />
<silkscreenpath route={[{"x":0.7873999999999342,"y":-1.4207997999999407},{"x":0.7873999999999342,"y":-1.4477999999999156}]} />
<silkscreenpath route={[{"x":-0.7874000000000478,"y":1.4477999999999156},{"x":-0.7874000000000478,"y":1.4207998000000543}]} />
<silkscreenpath route={[{"x":-0.7874000000000478,"y":-1.4208760000000211},{"x":-0.7874000000000478,"y":-1.4477999999999156}]} />
<silkscreencircle pcbX="-1.439926mm" pcbY="1.540002mm" radius="0.119888mm" />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="2.651mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-2.2000088000000915,"y":1.700009800000089},{"x":2.200008799999978,"y":1.700009800000089},{"x":2.200008799999978,"y":-1.6999843999999484},{"x":-2.2000088000000915,"y":-1.6999843999999484},{"x":-2.2000088000000915,"y":1.700009800000089}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C146314.obj?uuid=4a1a7184c8ce42649cbff39134d56aa1",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C146314.step?uuid=4a1a7184c8ce42649cbff39134d56aa1",
        pcbRotationOffset: 270,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: -0.45 },
      }}
      {...props}
    />
  )
}