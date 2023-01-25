varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

uniform float u_EffectProgress;
uniform float u_StripSize;
uniform float u_Time;
uniform float u_NoiseStrength;
uniform vec3 u_EmissionColor;

uniform sampler2D t_MatcapA;
uniform sampler2D t_MatcapB;
uniform sampler2D t_Noise;

#include <normal_pars_fragment>

void main(){
  vec4 diffuseColor=vec4(1.);

  #include <normal_fragment_begin>

  vec3 viewDir=normalize(vViewPosition);
  vec3 x=normalize(vec3(viewDir.z,0.,-viewDir.x));
  vec3 y=cross(viewDir,x);
  vec2 uv=vec2(dot(x,normal),dot(y,normal))*.495+.5;// 0.495 to remove artifacts caused by undersized matcap disks

  //
  // Matcaps
  //
  vec4 matcapColorA=texture2D(t_MatcapA,uv);
  vec4 matcapColorB=texture2D(t_MatcapB,uv);

  //
  // Noise
  //
  vec4 noiseTexture=texture2D(t_Noise,vUv+vec2(u_Time*.047,u_Time*.062));

  //
  // Masks
  //
  float maskPositionY=vPosition.y-u_EffectProgress;
  maskPositionY/=noiseTexture.b*u_NoiseStrength;

  float maskTop=step(u_StripSize,maskPositionY);

  float maskCenter=abs(maskPositionY);
  maskCenter=step(u_StripSize,maskCenter);
  maskCenter=1.-maskCenter;

  float maskBottom=1.-step(-u_StripSize,maskPositionY);

  //
  // Final color
  //
  vec3 outgoingLight = matcapColorA.rgb*maskTop + u_EmissionColor*maskCenter + matcapColorB.rgb*maskBottom;

  #include <output_fragment>
}
