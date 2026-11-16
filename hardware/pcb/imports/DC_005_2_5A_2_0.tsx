import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"]
} as const

export const DC_005_2_5A_2_0 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicpath points={[{"x":0,"y":0.2},{"x":-0.12,"y":0.2}]} strokeColor="#880000" />
          <schematicrect schX={-0.16} schY={0.2} width={0.08} height={0.24} strokeWidth={0.02} color="#880000" />
          <schematicpath points={[{"x":-0.2,"y":0.28},{"x":-0.6,"y":0.28}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.2,"y":0.12},{"x":-0.6,"y":0.12}]} strokeColor="#880000" />
          <schematicpath svgPath="M -0.6 0.12 A 0.08 0.08 0 1 0 -0.6 0.28" strokeColor="#880000" />
          <schematicpath points={[{"x":0,"y":-0.2},{"x":-0.58,"y":-0.2},{"x":-0.62,"y":-0.12},{"x":-0.66,"y":-0.2}]} strokeColor="#880000" />
          <schematicpath points={[{"x":0,"y":0},{"x":-0.34,"y":0},{"x":-0.34,"y":-0.2},{"x":-0.36,"y":-0.1}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.34,"y":-0.2},{"x":-0.32,"y":-0.1}]} strokeColor="#880000" />
          <port name="pin1" pinNumber={1} aliases={["1"]} direction="right" schX={0.4} schY={0.2} schStemLength={0.4} />
          <port name="pin2" pinNumber={2} aliases={["2"]} direction="right" schX={0.4} schY={-0.2} schStemLength={0.4} />
          <port name="pin3" pinNumber={3} aliases={["3"]} direction="right" schX={0.4} schY={0} schStemLength={0.4} />
          <schematictext schX={-0.12} schY={0.6} text="{NAME}" fontSize={0.2} anchor="bottom_center" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C319099"
  ]
}}
      manufacturerPartNumber="DC-005-2.5A-2.0"
      footprint={<footprint>
        <platedhole  portHints={["pin1"]} pcbX="2.99974mm" pcbY="2.350135mm" holeWidth="1.1999976mm" holeHeight="3.700018mm" outerWidth="1.7999964mm" outerHeight="4.1999916mm" shape="pill" />
<platedhole  portHints={["pin2"]} pcbX="-2.99974mm" pcbY="2.350135mm" holeWidth="1.1999976mm" holeHeight="3.700018mm" outerWidth="1.7999964mm" outerHeight="4.1999916mm" pcbRotation="180deg" shape="pill" />
<platedhole  portHints={["pin3"]} pcbX="0mm" pcbY="-2.350135mm" holeWidth="1.1999976mm" holeHeight="3.700018mm" outerWidth="1.7999964mm" outerHeight="4.1999916mm" pcbRotation="270deg" shape="pill" />
<silkscreenpath route={[{"x":-10.899978200000078,"y":-2.14975440000012},{"x":-10.900003599999991,"y":6.850253000000066}]} />
<silkscreenpath route={[{"x":-10.900003599999991,"y":6.850253000000066},{"x":3.5003739999999652,"y":6.850253000000066}]} />
<silkscreenpath route={[{"x":-7.19963000000007,"y":-2.1497289999999794},{"x":-7.19963000000007,"y":6.850253000000066}]} />
<silkscreenpath route={[{"x":-7.1196200000000545,"y":-0.8497570000000678},{"x":3.5003739999999652,"y":-0.8497570000000678}]} />
<silkscreenpath route={[{"x":-7.1196200000000545,"y":5.550027},{"x":3.5003739999999652,"y":5.550027}]} />
<silkscreenpath route={[{"x":-10.899978200000078,"y":-2.14975440000012},{"x":-2.3132034000000203,"y":-2.14975440000012}]} />
<silkscreenpath route={[{"x":2.3132034000000203,"y":-2.14975440000012},{"x":3.5003739999999652,"y":-2.14975440000012}]} />
<silkscreenpath route={[{"x":3.5003739999999652,"y":6.850253000000066},{"x":3.5003739999999652,"y":4.564151400000014}]} />
<silkscreenpath route={[{"x":3.5003739999999652,"y":0.13611859999991793},{"x":3.5003739999999652,"y":-2.14975440000012}]} />
<silkscreentext text="{NAME}" pcbX="-3.70332mm" pcbY="7.845935mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-10.974997599999938,"y":7.149935400000004},{"x":4.149738200000002,"y":7.149935400000004},{"x":4.149738200000002,"y":-3.5001332000000502},{"x":-10.974997599999938,"y":-3.5001332000000502},{"x":-10.974997599999938,"y":7.149935400000004}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C319099.obj?uuid=4a910b5b20c5482997377d2072aab01b",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C319099.step?uuid=4a910b5b20c5482997377d2072aab01b",
        pcbRotationOffset: 270,
        modelOriginPosition: { x: 2.3999447000000145, y: 3.2250052999999297, z: -0.000008000000000230045 },
      }}
      {...props}
    />
  )
}