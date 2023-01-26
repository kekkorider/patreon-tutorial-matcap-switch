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
    u_StripSize: { value: 0.23 },
    u_Time: { value: 0 },
    u_EmissionColor: { value: new Vector4(26 / 255, 210 / 255, 78 / 255, 1) },
    t_Noise: { value: null },
    t_MatcapA: { value: null },
    t_MatcapB: { value: null },
    u_NoiseStrength: { value: 1.35 },
  }
})
