#ifdef GL_ES
precision mediump float;
#endif


#pragma glslify: snoise3 = require(glsl-noise/simplex/3d) 

varying vec3 vNorm;
varying vec2 vUv;
varying float deform;
void main() {
  vUv = uv;
  vNorm = position.xyz;
  vec3 worldPos = vec4(modelMatrix * vec4(position,1.0)).xyz;
  deform = 0.5 * snoise3(worldPos * 0.03) + snoise3(worldPos * 0.05);
  //deform =  10. * snoise3(worldPos * 0.005) +  5. * snoise3(worldPos) * 0.01 +  1. * snoise3(worldPos* 0.05);
  vec3 newPosition = vec3(position.x,position.y, deform * 4.); 
  gl_Position = projectionMatrix *
              modelViewMatrix *
              vec4(newPosition, 1.0);


}
