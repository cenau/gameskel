#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vNorm;
varying vec2 vUv;
uniform float logDepthBufFC;
varying float vFragDepth;
void main() {
  vUv = uv;
  vNorm = position.xyz;
  gl_Position = projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
 // gl_Position.z = log2(max( 0.00001, gl_Position.w + 1.0 )) * logDepthBufFC;
 // gl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;
}
