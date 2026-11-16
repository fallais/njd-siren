import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"]
} as const

export const A_2541WV_07P = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C25503132"
  ]
}}
      manufacturerPartNumber="2541WV-07P"
      footprint={<footprint>
        <platedhole  portHints={["pin1"]} pcbX="-7.62mm" pcbY="0mm" holeWidth="0.999998mm" holeHeight="0.999998mm" outerWidth="1.5999968mm" outerHeight="1.5999968mm" rectPad={true} pcbRotation="0deg" shape="pill" />
<platedhole  portHints={["pin2"]} pcbX="-5.08mm" pcbY="0mm" outerDiameter="1.5999968mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="-2.54mm" pcbY="0mm" outerDiameter="1.5999968mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin4"]} pcbX="0mm" pcbY="0mm" outerDiameter="1.5999968mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin5"]} pcbX="2.54mm" pcbY="0mm" outerDiameter="1.5999968mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin6"]} pcbX="5.08mm" pcbY="0mm" outerDiameter="1.5999968mm" holeDiameter="0.999998mm" shape="circle" />
<platedhole  portHints={["pin7"]} pcbX="7.62mm" pcbY="0mm" outerDiameter="1.5999968mm" holeDiameter="0.999998mm" shape="circle" />
<silkscreenpath route={[{"x":-8.88992380000002,"y":1.2699999999999818},{"x":8.889999999999986,"y":1.2699999999999818}]} />
<silkscreenpath route={[{"x":8.889974600000073,"y":-1.2501118000000133},{"x":8.889974600000073,"y":1.2498831999998856}]} />
<silkscreenpath route={[{"x":-8.889949199999933,"y":-1.2501118000000133},{"x":8.889974600000073,"y":-1.2501118000000133}]} />
<silkscreenpath route={[{"x":-8.82141999999999,"y":1.2496545999999853},{"x":-8.889999999999873,"y":1.2496545999999853}]} />
<silkscreenpath route={[{"x":-8.889949199999933,"y":1.2498831999998856},{"x":-8.889949199999933,"y":-1.2501118000000133}]} />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="2.27mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-9.139999999999873,"y":1.5199999999999818},{"x":9.139999999999986,"y":1.5199999999999818},{"x":9.139999999999986,"y":-1.494600000000105},{"x":-9.139999999999873,"y":-1.494600000000105},{"x":-9.139999999999873,"y":1.5199999999999818}]} />
      </footprint>}
      
      {...props}
    />
  )
}