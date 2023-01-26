import { DoubleSide, ShaderMaterial, Vector4 } from 'three'

import vertexShader from './vertex.glsl'
import fragmentShader from './fragment.glsl'

export const MatcapSwitchMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: false,
  side: DoubleSide,
  uniforms: {
    u_EffectProgress: { value: 0 },
    u_StripSize: { value: 0.33 },
    u_Time: { value: 0 },
    u_EmissionColorA: { value: new Vector4(61 / 255, 255 / 255, 176 / 255, 1) },
    u_EmissionColorB: { value: new Vector4(223 / 255, 195 / 255, 74 / 255, 1) },
    t_Noise: { value: null },
    t_MatcapA: { value: null },
    t_MatcapB: { value: null },
    u_NoiseStrength: { value: 2.6 },
  }
})
