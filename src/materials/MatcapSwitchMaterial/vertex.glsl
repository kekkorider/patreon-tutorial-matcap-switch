varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vPosition;

attribute vec3 a_Centroid;

uniform float u_EffectProgress;
uniform float u_StripSize;

#include <common>
#include <normal_pars_vertex>

#include ../../glsl/modules/Rotate.glsl

void main(){
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>

  #include <begin_vertex>

  // Get the local coordinates of each face.
  vec3 localPos = transformed - a_Centroid;

  // Calculate the distance between each face's centroid and a vec3(0.0, e_EffectProgress, 0.0) vector,
  // and then `smoothstep` it to get a value between 0.0 and 1.0.
  float dist = length(a_Centroid.y - u_EffectProgress);
  dist = max(0.0, smoothstep(0.1, 0.1 + u_StripSize, dist));

  // Rotate the faces around the Y axis.
  localPos.xz *= Rotate(PI2*smoothstep(u_StripSize, 0.0, u_EffectProgress-a_Centroid.y));

  // Scale down the faces based on the distance calculated above.
  localPos *= dist;

  // Place the faces to their original position after having manipulated them.
  transformed = a_Centroid + localPos;

  #include <project_vertex>

  // Position of the mesh in world space
  vWorldPosition=(modelMatrix*vec4(position,1.)).xyz;

  vViewPosition=-mvPosition.xyz;

  vUv = uv;
  vPosition = transformed;
}
