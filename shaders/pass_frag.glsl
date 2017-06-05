varying vec2 vUv;
uniform sampler2D tDiffuse; 
uniform vec2 iResolution;
uniform float iGlobalTime;
uniform float amount;


void main() {
    vec4 colour = texture2D(tDiffuse,vUv);
    gl_FragColor = vec4(colour);
}
