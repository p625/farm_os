export const FARMOS_TERRAIN_VERTEX_SHADER = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 color;
attribute vec2 uv2;

uniform mat4 world;
uniform mat4 worldViewProjection;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUV;
varying vec4 vSplat0;
varying vec4 vSplat1;
varying vec2 vSplat2RG;

void main(void) {
  vec4 worldPos = world * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(mat3(world) * normal);
  vUV = uv;
  vSplat0 = color;
  vSplat1 = vec4(uv2, 0.0, 0.0);
  vSplat2RG = vec2(0.0);
  gl_Position = worldViewProjection * vec4(position, 1.0);
}
`

export const FARMOS_TERRAIN_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUV;
varying vec4 vSplat0;
varying vec4 vSplat1;
varying vec2 vSplat2RG;

uniform sampler2D uAlbedoAtlas;
uniform sampler2D uNormalHeightAtlas;
uniform sampler2D uAoRoughAtlas;
uniform sampler2D uMacroAtlas;
uniform sampler2D uDetailAtlas;
uniform sampler2D uSplatMap0;
uniform sampler2D uSplatMap1;
uniform sampler2D uSplatMap2;

uniform float uSlotUvScale[24];
uniform float uSlotUvOffset[24];
uniform float uSlotUvScales[12];
uniform float uSlotNormalStrength[12];
uniform float uSlotRoughMul[12];
uniform float uSlotMacroScale[12];

uniform float uUseSplatTextures;
uniform float uHeightBlendEnabled;
uniform float uHeightBlendSharpness;
uniform float uSplatSoftness;
uniform float uMacroEnabled;
uniform float uMacroColorStrength;
uniform float uMacroRoughStrength;
uniform float uMacroNormalStrength;
uniform float uDetailEnabled;
uniform float uDetailUvScale;
uniform float uDetailNormalStrength;
uniform float uDetailFadeStart;
uniform float uDetailFadeEnd;
uniform float uAntiTileEnabled;
uniform float uAntiTileRotation;
uniform float uAntiTileOffset;
uniform float uSlopeRulesEnabled;
uniform float uRockMinSlope;
uniform float uRockMaxSlope;
uniform float uRockSlot;
uniform float uWarmth;
uniform float uGreenBias;
uniform float uSaturation;
uniform float uContrast;
uniform float uBrightness;
uniform float uShadowLift;
uniform float uEmissiveBoost;
uniform vec3 uCameraPosition;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec2 antiTileWorldUV(vec2 worldXZ, float uvScale, int slot) {
  float seed = float(slot) * 1.73;
  float angle = hash21(vec2(seed, 2.0)) * 6.28318 * uAntiTileRotation;
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  vec2 base = worldXZ * uvScale;
  float n = valueNoise(worldXZ * 0.003 + seed);
  vec2 offset = vec2(hash21(vec2(seed, 3.0)), hash21(vec2(seed, 4.0))) * uAntiTileOffset;
  return rot * base + offset * n;
}

vec2 atlasUV(vec2 tileUV, int slot) {
  float ox = uSlotUvOffset[slot * 2];
  float oy = uSlotUvOffset[slot * 2 + 1];
  float sx = uSlotUvScale[slot * 2];
  float sy = uSlotUvScale[slot * 2 + 1];
  return vec2(ox, oy) + fract(tileUV) * vec2(sx, sy);
}

struct MatSample {
  vec3 albedo;
  vec3 normal;
  float roughness;
  float ao;
  float height;
};

MatSample sampleMaterial(int slot, vec2 worldXZ) {
  MatSample m;
  float uvScale = uSlotUvScales[slot];
  vec2 tuv = uAntiTileEnabled > 0.5
    ? antiTileWorldUV(worldXZ, uvScale, slot)
    : worldXZ * uvScale;
  vec2 auv = atlasUV(tuv, slot);

  m.albedo = texture2D(uAlbedoAtlas, auv).rgb;
  vec4 nh = texture2D(uNormalHeightAtlas, auv);
  m.normal = normalize(vec3(nh.rg * 2.0 - 1.0, 1.0));
  m.height = nh.b;
  vec2 ar = texture2D(uAoRoughAtlas, auv).rg;
  m.ao = ar.r;
  m.roughness = ar.g * uSlotRoughMul[slot];

  float macro = texture2D(uMacroAtlas, worldXZ * uSlotMacroScale[slot]).r;
  if (uMacroEnabled > 0.5) {
    float macroOffset = (macro - 0.5) * 2.0;
    m.albedo *= 1.0 + macroOffset * uMacroColorStrength;
    m.roughness = clamp(m.roughness + macroOffset * uMacroRoughStrength, 0.04, 1.0);
    vec3 macroNormal = vec3(macroOffset * uMacroNormalStrength, 0.0, 0.0);
    m.normal = normalize(m.normal + macroNormal);
  }

  m.normal = normalize(vec3(m.normal.xy * uSlotNormalStrength[slot], m.normal.z));
  return m;
}

float detailFade(vec3 worldPos) {
  float dist = distance(worldPos, uCameraPosition);
  return 1.0 - smoothstep(uDetailFadeStart, uDetailFadeEnd, dist);
}

vec3 applyDetail(vec3 albedo, vec3 normal, vec2 worldXZ, vec3 worldPos) {
  if (uDetailEnabled < 0.5) {
    return albedo;
  }
  float fade = detailFade(worldPos);
  if (fade <= 0.001) {
    return albedo;
  }
  vec3 detail = texture2D(uDetailAtlas, fract(worldXZ * uDetailUvScale)).rgb;
  return mix(albedo, albedo * (0.85 + detail * 0.3), fade * 0.45);
}

vec3 applyDetailNormal(vec3 normal, vec2 worldXZ, vec3 worldPos) {
  if (uDetailEnabled < 0.5) {
    return normal;
  }
  float fade = detailFade(worldPos);
  vec3 detailN = texture2D(uDetailAtlas, fract(worldXZ * uDetailUvScale * 2.2)).rgb * 2.0 - 1.0;
  return normalize(mix(normal, normal + detailN * uDetailNormalStrength, fade));
}

float heightBlendWeight(float weight, float height, float maxH) {
  if (uHeightBlendEnabled < 0.5) {
    return weight;
  }
  return weight * (1.0 + pow(height / max(maxH, 0.001), uHeightBlendSharpness));
}

vec4 softenSplat(vec4 w) {
  float s = 1.0 + uSplatSoftness;
  w = pow(max(w, vec4(0.0)), vec4(s));
  float sum = dot(w, vec4(1.0));
  return sum > 0.0001 ? w / sum : w;
}

MatSample blendLayer(vec4 weights, int slotBase, vec2 worldXZ) {
  MatSample result;
  result.albedo = vec3(0.0);
  result.normal = vec3(0.0, 0.0, 1.0);
  result.roughness = 0.0;
  result.ao = 0.0;
  result.height = 0.0;

  float maxH = 0.0;
  MatSample mats[4];
  float w[4];
  w[0] = weights.r; w[1] = weights.g; w[2] = weights.b; w[3] = weights.a;

  for (int i = 0; i < 4; i++) {
    mats[i] = sampleMaterial(slotBase + i, worldXZ);
    maxH = max(maxH, mats[i].height);
  }

  float total = 0.0;
  for (int i = 0; i < 4; i++) {
    w[i] = heightBlendWeight(w[i], mats[i].height, maxH);
    total += w[i];
  }
  if (total < 0.0001) {
    return mats[0];
  }
  for (int i = 0; i < 4; i++) {
    float nw = w[i] / total;
    result.albedo += mats[i].albedo * nw;
    result.normal += mats[i].normal * nw;
    result.roughness += mats[i].roughness * nw;
    result.ao += mats[i].ao * nw;
    result.height += mats[i].height * nw;
  }
  result.normal = normalize(result.normal);
  return result;
}

vec3 applyColorGrading(vec3 color) {
  color.g += uGreenBias;
  color.r += uWarmth;
  color.b -= uWarmth * 0.35;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, uSaturation);
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;
  return max(color, vec3(uShadowLift));
}

void main(void) {
  vec4 splat0 = vSplat0;
  vec4 splat1 = vSplat1;
  vec4 splat2 = vec4(vSplat2RG, 0.0, 0.0);

  if (uUseSplatTextures > 0.5) {
    splat0 = texture2D(uSplatMap0, vUV);
    splat1 = texture2D(uSplatMap1, vUV);
    splat2 = texture2D(uSplatMap2, vUV);
  }

  splat0 = softenSplat(splat0);
  splat1 = softenSplat(splat1);
  splat2 = softenSplat(splat2);

  vec2 worldXZ = vWorldPos.xz;
  MatSample layer0 = blendLayer(splat0, 0, worldXZ);
  MatSample layer1 = blendLayer(splat1, 4, worldXZ);
  MatSample layer2 = blendLayer(splat2, 8, worldXZ);

  float t0 = dot(splat0, vec4(1.0));
  float t1 = dot(splat1, vec4(1.0));
  float t2 = dot(splat2, vec4(1.0));
  float total = t0 + t1 + t2;
  if (total < 0.0001) {
    layer1 = sampleMaterial(5, worldXZ);
    total = 1.0;
    t1 = 1.0;
    t0 = 0.0;
    t2 = 0.0;
  }

  MatSample surface;
  surface.albedo = (layer0.albedo * t0 + layer1.albedo * t1 + layer2.albedo * t2) / total;
  surface.normal = normalize((layer0.normal * t0 + layer1.normal * t1 + layer2.normal * t2) / total);
  surface.roughness = (layer0.roughness * t0 + layer1.roughness * t1 + layer2.roughness * t2) / total;
  surface.ao = (layer0.ao * t0 + layer1.ao * t1 + layer2.ao * t2) / total;

  if (uSlopeRulesEnabled > 0.5) {
    float slope = 1.0 - clamp(vNormal.y, 0.0, 1.0);
    float rockW = smoothstep(uRockMinSlope, uRockMaxSlope, slope);
    if (rockW > 0.001) {
      MatSample rock = sampleMaterial(int(uRockSlot), worldXZ);
      float blend = rockW;
      surface.albedo = mix(surface.albedo, rock.albedo, blend);
      surface.normal = normalize(mix(surface.normal, rock.normal, blend));
      surface.roughness = mix(surface.roughness, rock.roughness, blend);
      surface.ao = mix(surface.ao, rock.ao, blend);
    }
  }

  surface.albedo = applyDetail(surface.albedo, surface.normal, worldXZ, vWorldPos);
  vec3 geomNormal = normalize(vNormal);
  vec3 normal = normalize(mix(geomNormal, applyDetailNormal(surface.normal, worldXZ, vWorldPos), 0.65));

  vec3 lightDir = normalize(uLightDirection);
  float ndotl = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = surface.albedo * (uAmbientColor + uLightColor * ndotl) * surface.ao;
  vec3 viewDir = normalize(uCameraPosition - vWorldPos);
  vec3 halfDir = normalize(lightDir + viewDir);
  float specPower = mix(8.0, 64.0, 1.0 - surface.roughness);
  float spec = pow(max(dot(normal, halfDir), 0.0), specPower) * (1.0 - surface.roughness) * 0.04;

  vec3 color = applyColorGrading(diffuse + uLightColor * spec + surface.albedo * uEmissiveBoost);
  gl_FragColor = vec4(color, 1.0);
}
`
