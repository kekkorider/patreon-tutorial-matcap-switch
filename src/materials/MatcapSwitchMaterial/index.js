import { DoubleSide, ShaderMaterial } from 'three'

import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

export const MatcapSwitchMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: false,
  side: DoubleSide,
  uniforms: {
    u_EffectProgress: { value: 0 },
    u_StripSize: { value: 0.1 },
  }
})
