//  MIT License
//
//  Copyright (c) 2023 Lars Wander
//
//  Permission is hereby granted, free of charge, to any person obtaining a
//  copy of this software and associated documentation files (the "Software"),
//  to deal in the Software without restriction, including without limitation
//  the rights to use, copy, modify, merge, publish, distribute, sublicense,
//  and/or sell copies of the Software, and to permit persons to whom the
//  Software is furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//  DEALINGS IN THE SOFTWARE.

import {D65X, D65Y, D65Z, WHITE, YELLOW, BLUE, SPD_BUCKETS} from './consts.js';

// Basic vertex shader to assign unit coordinates.
const KM_VERT_SRC = `#version 300 es
precision highp float;

in vec2 a_coord;

out vec2 v_tex;

void main() {
   vec2 pos = (a_coord * 2.0) - 1.0;
   gl_Position = vec4(pos, 0.0, 1.0);
   v_tex = a_coord;
}
`

// Kubelka-Munk fragment shader.
const KM_FRAG_SRC = `#version 300 es
precision highp float;

// Reflectance constants.
const float K1 = 0.0031;
const float K2 = 0.650;

// Normalization factor for Y.
const float YD65 = 11619.34742175;

// XYZ -> RGB conversion matrix.
const mat3 C = mat3( 3.2404542, -1.5371385, -0.4985314,
                    -0.9692660,  1.8760108,  0.0415560,
                     0.0556434, -0.2040259,  1.0572252);

// Paint K & S curves.
uniform vec3 u_Pk[${SPD_BUCKETS}];
uniform vec3 u_Ps[${SPD_BUCKETS}];

// XYZ spectral sensitivity curve.
uniform vec3 u_obs[${SPD_BUCKETS}];

in vec2 v_tex;
out vec4 o_col;

float reflectance_mix(float ks) {
  return 1.0 + ks - sqrt(ks * ks + 2.0 * ks);
}

float saunderson_mix(float ks) {
  float R = reflectance_mix(ks);
  return ((1.0 - K1) * (1.0 - K2) * R) / (1.0 - K2 * R);
}

vec3 rgb_to_srgb(in vec3 rgb) {
  return pow(rgb, vec3(1.0 / 2.2));
}

vec3 pigment_to_srgb(vec3 P) {
  vec3 res = vec3(0.0, 0.0, 0.0);
  vec3 table[${SPD_BUCKETS}];

  for (int f = 0; f < ${SPD_BUCKETS}; f++) {
    float K = dot(P, u_Pk[f]);
    float S = dot(P, u_Ps[f]);

    float R = saunderson_mix(K / S);
    table[f] = u_obs[f] * R;
  }

  // Trapezoidal rule for integration.
  for (int f = 0; f < ${SPD_BUCKETS} - 1; f++) {
    res += table[f] + table[f + 1];
  }
  res *= 5.0;

  return rgb_to_srgb(res * C / YD65);
}

void main(void) {
  vec3 pigments = vec3(v_tex.y, v_tex.x, 1.0 - v_tex.x);
  o_col = vec4(pigment_to_srgb(pigments), 1.0);
}
`;

function glZip(arrs) {
  const res = Array(arrs[0].length * arrs.length);
  for (let i = 0; i < arrs[0].length; i++) {
    for (let k = 0; k < arrs.length; k++) {
      res[i * arrs.length + k] = arrs[k][i];
    }
  }

  return res;
}

function createShader(gl, shaderType, shaderSrc) {
  const shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(shaderSrc, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Unable to compile shader, see console");
  }

  return shader;
}

function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error("Unable to link program, see console");
  }

  return program;
}

// 1-time setup to prepare GL state.
function setupPaintMix(canvas, paints) {
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("Unable to acquire webgl2 context");

  const vertShader = createShader(gl, gl.VERTEX_SHADER, KM_VERT_SRC);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, KM_FRAG_SRC)

  const program = createProgram(gl, vertShader, fragShader);

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);

  const x0 = 0, y0 = 0, x1 = 1, y1 = 1;
  const coordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x0, y0,
     x1, y0,
     x0, y1,
     x0, y1,
     x1, y0,
     x1, y1,
  ]), gl.STATIC_DRAW);

  const coordLoc = gl.getAttribLocation(program, "a_coord");
  gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
  gl.enableVertexAttribArray(coordLoc);
  gl.vertexAttribPointer(coordLoc, 2, gl.FLOAT, false, 0, 0);

  const locs = {}
  for (const u of ["u_obs", "u_Pk", "u_Ps"]) {
    locs[u] = gl.getUniformLocation(program, u);
  }

  // Zip paint vectors and observer functions into GL-friendly format.
  const obs = glZip([D65X, D65Y, D65Z]);
  const paintK = glZip(paints.map(paint => paint.k));
  const paintS = glZip(paints.map(paint => paint.s));

  return {
    gl,
    canvas,
    program,
    locs,
    vertexArray,
    obs,
    paintK,
    paintS,
  }
}

function ensureCanvasSize(canvas, width, height) {
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width;
  canvas.style.height = height;
}

// Runs the KM shader. This can be run on every frame.
function runPaintMix(paintMix, width, height) {
  const {gl, program, vertexArray, locs, obs, paintS, paintK} = paintMix;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.bindVertexArray(vertexArray);

  gl.uniform3fv(locs.u_obs, obs);
  gl.uniform3fv(locs.u_Pk, paintK);
  gl.uniform3fv(locs.u_Ps, paintS);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function main() {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  const paintMix = setupPaintMix(canvas, [WHITE, YELLOW, BLUE]);

  function draw() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ensureCanvasSize(canvas, width, height);
    runPaintMix(paintMix, width, height);
  }

  window.addEventListener("resize", draw);
  draw();
}

main();
