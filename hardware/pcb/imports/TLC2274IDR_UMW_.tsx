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
  pin14: ["pin14"]
} as const

export const TLC2274IDR_UMW_ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C22368276"
  ]
}}
      manufacturerPartNumber="TLC2274IDR(UMW)"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-3.81mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-2.54mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-1.27mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="1.27mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="2.54mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="3.81mm" pcbY="-2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="3.81mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="2.54mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="1.27mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="0mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="-1.27mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="-2.54mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="-3.81mm" pcbY="2.61493mm" width="0.5599938mm" height="1.4299946mm" shape="rect" />
<silkscreenpath route={[{"x":-4.4261786,"y":-1.595196200000018},{"x":-4.4261786,"y":1.5951962000000037},{"x":4.4262039999999985,"y":1.5951962000000037},{"x":4.4262039999999985,"y":-1.595196200000018},{"x":-4.4261786,"y":-1.595196200000018}]} />
<silkscreencircle pcbX="-4.13639mm" pcbY="-1.305306mm" radius="0.068834mm" />
<silkscreencircle pcbX="-4.7625mm" pcbY="-2.61493mm" radius="0.100076mm" />
<silkscreentext text="{NAME}" pcbX="-0.2032mm" pcbY="4.3274mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.5999786,"y":3.5799272999999943},{"x":4.600003999999984,"y":3.5799272999999943},{"x":4.600003999999984,"y":-3.5799273000000085},{"x":-4.5999786,"y":-3.5799273000000085},{"x":-4.5999786,"y":3.5799272999999943}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C22368276.obj?uuid=6e33d4ed62a947d49bd5721dc2f31c10",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C22368276.step?uuid=6e33d4ed62a947d49bd5721dc2f31c10",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000013410317, y: 0, z: -0.98 },
      }}
      {...props}
    />
  )
}