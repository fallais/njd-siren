import type { CapacitorProps } from "@tscircuit/props"

export const RVT100UF35V67RV0034 = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100uF"
      polarized
      supplierPartNumbers={{
  "jlcpcb": [
    "C2836442"
  ]
}}
      manufacturerPartNumber="RVT100UF35V67RV0034"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-2.669921mm" pcbY="0mm" width="3.499993mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="2.669921mm" pcbY="0mm" width="3.499993mm" height="1.1999976mm" shape="rect" />
<silkscreenpath route={[{"x":3.3555431999999428,"y":-0.7393432000001212},{"x":3.3756345999998985,"y":-3.375710799999979},{"x":-1.981250799999998,"y":-3.375710799999979},{"x":-3.3757107999998652,"y":-1.9812508000001117},{"x":-3.3623757999998816,"y":-0.6858254000001125}]} />
<silkscreenpath route={[{"x":3.3694370000000617,"y":0.707644000000073},{"x":3.376142600000094,"y":3.3761171999999533},{"x":-1.980056999999988,"y":3.3761171999999533},{"x":-3.37619339999992,"y":1.9799807999999075},{"x":-3.37619339999992,"y":0.6857491999999183}]} />
<silkscreentext text="{NAME}" pcbX="-0.008763mm" pcbY="4.374644mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":3.1019496000000117,"y":0.09895840000001499},{"x":3.1019496000000117,"y":-0.09906000000000859},{"x":2.3099522000001116,"y":-0.09906000000000859},{"x":2.3099522000001116,"y":0.09895840000001499},{"x":3.1019496000000117,"y":0.09895840000001499}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-3.1020512000000053,"y":0.09895840000001499},{"x":-3.1020512000000053,"y":-0.09906000000000859},{"x":-2.310053799999878,"y":-0.09906000000000859},{"x":-2.310053799999878,"y":0.09895840000001499},{"x":-3.1020512000000053,"y":0.09895840000001499}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-2.8050490000000536,"y":0.6599427999999534},{"x":-2.8050490000000536,"y":-0.660044399999947},{"x":-2.607055999999943,"y":-0.660044399999947},{"x":-2.607055999999943,"y":0.6599427999999534},{"x":-2.8050490000000536,"y":0.6599427999999534}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-4.669917499999997,"y":3.5498155999998744},{"x":4.669917499999997,"y":3.5498155999998744},{"x":4.669917499999997,"y":-3.5501712000000225},{"x":-4.669917499999997,"y":-3.5501712000000225},{"x":-4.669917499999997,"y":3.5498155999998744}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2836442.obj?uuid=19c047b38b814d5099587d6a780dd6ee",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2836442.step?uuid=19c047b38b814d5099587d6a780dd6ee",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: -0.0001015999999935957, y: -0.0001778000000740576, z: -0.02 },
      }}
      {...restProps}
    />
  )
}