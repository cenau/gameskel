#ifdef GL_ES
precision mediump float;
#endif

#define FOG_DENSITY 0.025

uniform vec2 iResolution;
varying vec2 vUv;
uniform float iGlobalTime;
varying vec3 vNorm;
uniform float logDepthBufFC;
varying float vFragDepth;
varying float deform;
varying float deform2;

#pragma glslify: fog_exp = require(glsl-fog/exp) 
#pragma glslify: fog_exp2 = require(glsl-fog/exp2) 

void main() {
    vec2 st = vUv;
    vec3 color = vec3(0.8 + deform * 0.5,0.2,0.5-2.*deform); 
float fogDistance = gl_FragCoord.z / gl_FragCoord.w;
  float fogAmount = fog_exp2(fogDistance, FOG_DENSITY);
  vec4 fogColor = vec4(1,0.5,0.,1.); // white 

    gl_FragColor = vec4(mix(vec4(color, 1.0),fogColor,fogAmount));
}
