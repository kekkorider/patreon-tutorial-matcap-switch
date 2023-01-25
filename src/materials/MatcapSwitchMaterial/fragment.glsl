varying vec2 vUv;
varying vec3 vPosition;

uniform float u_EffectProgress;
uniform float u_StripSize;
uniform float u_Time;
uniform float u_NoiseStrength;

uniform sampler2D t_Noise;

void main(){
  vec3 color=vec3(0.);
  vec4 noiseTexture=texture2D(t_Noise,vUv+vec2(u_Time*.047,u_Time*.062));
  
  float coords=vPosition.y-u_EffectProgress;
  coords/=noiseTexture.b*u_NoiseStrength;
  
  float maskTop=step(u_StripSize,coords);
  
  float maskCenter=abs(coords);
  maskCenter=step(u_StripSize,maskCenter);
  maskCenter=1.-maskCenter;
  
  float maskBottom=1.-step(-u_StripSize,coords);
  
  color=vec3(maskTop,maskCenter,maskBottom);
  
  gl_FragColor=vec4(color,1.);
}
