import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["pin8"],
  pin9: ["pin9"],
  pin10: ["pin10"],
  pin11: ["pin11"],
  pin12: ["pin12"],
  pin13: ["pin13"],
  pin14: ["pin14"],
  pin15: ["pin15"],
  pin16: ["pin16"]
} as const

export const LM13700MX_NOPB = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C174050"
  ]
}}
      manufacturerPartNumber="LM13700MX/NOPB"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-4.445mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin2"]} pcbX="-3.175mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin3"]} pcbX="-1.905mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin4"]} pcbX="-0.635mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin5"]} pcbX="0.635mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin6"]} pcbX="1.905mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin7"]} pcbX="3.175mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin8"]} pcbX="4.445mm" pcbY="-2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin16"]} pcbX="-4.445mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin15"]} pcbX="-3.175mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin14"]} pcbX="-1.905mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin13"]} pcbX="-0.635mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin12"]} pcbX="0.635mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin11"]} pcbX="1.905mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin10"]} pcbX="3.175mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<smtpad portHints={["pin9"]} pcbX="4.445mm" pcbY="2.73558mm" width="0.6020054mm" height="1.9709892mm" radius="0.3010027mm" shape="pill" />
<silkscreenpath route={[{"x":-5.026202800000078,"y":-1.5214091999999937},{"x":-5.026202800000078,"y":1.5214092000001074},{"x":5.0262027999999646,"y":1.5214092000001074},{"x":5.0262027999999646,"y":-1.5214091999999937},{"x":-5.026202800000078,"y":-1.5214091999999937}]} />
<silkscreencircle pcbX="-4.445mm" pcbY="-0.769112mm" radius="0.150114mm" />
<silkscreencircle pcbX="-5.207mm" pcbY="-2.667mm" radius="0.150114mm" />
<silkscreentext text="{NAME}" pcbX="-0.1651mm" pcbY="4.429mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-5.19997740000008,"y":3.9710746000000654},{"x":5.200002799999993,"y":3.9710746000000654},{"x":5.200002799999993,"y":-3.9710746000000654},{"x":-5.19997740000008,"y":-3.9710746000000654},{"x":-5.19997740000008,"y":3.9710746000000654}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C174050.obj?uuid=9adfdf34b7774b23880141fd3e8b4dbb",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C174050.step?uuid=9adfdf34b7774b23880141fd3e8b4dbb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999842880061, y: 0, z: 0.000575 },
      }}
      {...props}
    />
  )
}