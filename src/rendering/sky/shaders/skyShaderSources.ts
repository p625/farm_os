export const FARMOS_SKY_VERTEX_SHADER = `
precision highp float;

attribute vec3 position;

uniform mat4 worldViewProjection;

varying vec3 vDirection;

void main(void) {
  vec4 worldPos = vec4(position, 1.0);
  vDirection = position;
  gl_Position = worldViewProjection * worldPos;
}
`

export const FARMOS_SKY_FRAGMENT_SHADER = `
precision highp float;

varying vec3 vDirection;

uniform vec3 uZenithColor;
uniform vec3 uHorizonColor;
uniform float uGradientPower;
uniform float uHorizonSoftness;
uniform float uHazeIntensity;

void main(void) {
  vec3 dir = normalize(vDirection);
  float elevation = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  float gradientT = pow(elevation, uGradientPower);
  vec3 skyColor = mix(uHorizonColor, uZenithColor, gradientT);

  float horizonFactor = pow(1.0 - elevation, 2.2);
  skyColor = mix(skyColor, uHorizonColor, horizonFactor * uHorizonSoftness);

  float haze = uHazeIntensity * pow(1.0 - elevation, 3.0);
  skyColor = mix(skyColor, uHorizonColor, haze * 0.45);

  gl_FragColor = vec4(skyColor, 1.0);
}
`
