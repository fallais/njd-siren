import type { LedProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode","neg"],
  pin2: ["anode","pos"]
} as const

export const NCD0805R1 = (props: LedProps) => {
  const { name = "LED1", ...restProps } = props

  return (
    <led
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C84256"
  ]
}}
      manufacturerPartNumber="NCD0805R1"
      footprint={<footprint>
        <smtpad portHints={["pin2","anode","pos"]} pcbX="1.100074mm" pcbY="0mm" width="0.999998mm" height="1.2500102mm" shape="rect" />
<smtpad portHints={["pin1","cathode","neg"]} pcbX="-1.100074mm" pcbY="0mm" width="0.999998mm" height="1.2500102mm" shape="rect" />
<silkscreenpath route={[{"x":0.4999735999999757,"y":0.9499091999999791},{"x":1.980056999999988,"y":0.9598913999999468}]} />
<silkscreenpath route={[{"x":0.6400545999999849,"y":-0.9401047999999719},{"x":1.980056999999988,"y":-0.9401047999999719}]} />
<silkscreenpath route={[{"x":1.980056999999988,"y":0.9598913999999468},{"x":1.980056999999988,"y":-0.9401302000001124}]} />
<silkscreenpath route={[{"x":-1.7500600000000759,"y":-0.95011240000008},{"x":-1.7500600000000759,"y":-0.9500616000000264},{"x":-2.099995799999988,"y":-0.6001258000001144}]} />
<silkscreenpath route={[{"x":-1.7500600000000759,"y":0.9499091999999791},{"x":-1.7500600000000759,"y":0.9498583999999255},{"x":-2.099995799999988,"y":0.5999226000000135}]} />
<silkscreenpath route={[{"x":-0.500024400000143,"y":0.9499091999999791},{"x":-1.7500600000000759,"y":0.9499091999999791}]} />
<silkscreenpath route={[{"x":-0.500024400000143,"y":-0.95011240000008},{"x":-1.7500600000000759,"y":-0.95011240000008}]} />
<silkscreenpath route={[{"x":-2.099995799999988,"y":0.5999226000000135},{"x":-2.099995799999988,"y":-0.6001258000001144}]} />
<silkscreenpath route={[{"x":0.30005019999998694,"y":0.49989740000000893},{"x":0.30005019999998694,"y":-0.5001006000001098}]} />
<silkscreenpath route={[{"x":0.30005019999998694,"y":-0.005156199999987621},{"x":-0.19994880000001558,"y":-0.005156199999987621}]} />
<silkscreentext text="{NAME}" pcbX="-0.066802mm" pcbY="1.9525mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":1.000048799999945,"y":0.6998715999999376},{"x":1.2000484000000142,"y":0.6998715999999376},{"x":1.2000484000000142,"y":-0.7001256000000922},{"x":1.000048799999945,"y":-0.7001256000000922},{"x":1.000048799999945,"y":0.6998715999999376}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":0.6346952000000101,"y":-0.09431020000010903},{"x":1.6346932000001289,"y":-0.09431020000010903},{"x":1.6346932000001289,"y":0.05567680000001474},{"x":0.6346952000000101,"y":0.05567680000001474},{"x":0.6346952000000101,"y":-0.09431020000010903}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-1.5999460000000454,"y":-0.0001015999999935957},{"x":-0.5999480000000403,"y":-0.0001015999999935957},{"x":-0.5999480000000403,"y":0.1498853999999028},{"x":-1.5999460000000454,"y":0.1498853999999028},{"x":-1.5999460000000454,"y":-0.0001015999999935957}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-1.8500730000000658,"y":0.875005099999953},{"x":1.8500730000000658,"y":0.875005099999953},{"x":1.8500730000000658,"y":-0.8751194000000169},{"x":-1.8500730000000658,"y":-0.8751194000000169},{"x":-1.8500730000000658,"y":0.875005099999953}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C84256.obj?uuid=23093642268545519703b953fc993978",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C84256.step?uuid=23093642268545519703b953fc993978",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.00005079999993995443, y: 0.00011430000006384944, z: -0.01 },
      }}
      {...restProps}
    />
  )
}