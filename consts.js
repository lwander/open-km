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

const SPD_MIN_NM = 380;
const SPD_MAX_NM = 750;
const SPD_STEP_SIZE_NM = 10;
export const SPD_BUCKETS = (SPD_MAX_NM - SPD_MIN_NM) / SPD_STEP_SIZE_NM + 1;

function assertBucketCount(curve, name) {
  if (curve.length !== SPD_BUCKETS) {
    throw new Error(
      `Invalid bucket count for ${name}: ${curve.length} != ${SPD_BUCKETS}`
    );
  }
}

// CIE standard illuminant D65, in 10nm increments from 380-750nm.
// https://en.wikipedia.org/wiki/Illuminant_D65
// https://cie.co.at/data-tables
const D65 = [49.9755, 54.6482, 82.7549, 91.486, 93.4318, 86.6823, 104.865,
  117.008, 117.812, 114.861, 115.923, 108.811, 109.354, 107.802, 104.79,
  107.689, 104.405, 104.046, 100, 96.3342, 95.788, 88.6856, 90.0062, 89.5991,
  87.6987, 83.2886, 83.6992, 80.0268, 80.2146, 82.2778, 78.2842, 69.7213,
  71.6091, 74.349, 61.604, 69.8856, 75.087, 63.5927];

assertBucketCount(D65, "D65 illuminant");

// CIElab standard observer functions, in 10nm increments from 380-750nm.
// https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_standard_observer
// https://cie.co.at/data-tables
const X_ = [0.0002, 0.0024, 0.0191, 0.0847, 0.2045, 0.3147, 0.3837, 0.3707,
  0.3023, 0.1956, 0.0805, 0.0162, 0.0038, 0.0375, 0.1177, 0.2365, 0.3768,
  0.5298, 0.7052, 0.8787, 1.0142, 1.1185, 1.124, 1.0305, 0.8563, 0.6475,
  0.4316, 0.2683, 0.1526, 0.0813, 0.0409, 0.0199, 0.0096, 0.0046, 0.0022,
  0.001, 0.0005, 0.0003];

assertBucketCount(X_, "CIE X observer");

const Y_ = [0, 0.0003, 0.002, 0.0088, 0.0214, 0.0387, 0.0621, 0.0895, 0.1282,
  0.1852, 0.2536, 0.3391, 0.4608, 0.6067, 0.7618, 0.8752, 0.962, 0.9918,
  0.9973, 0.9556, 0.8689, 0.7774, 0.6583, 0.528, 0.3981, 0.2835, 0.1798,
  0.1076, 0.0603, 0.0318, 0.0159, 0.0077, 0.0037, 0.0018, 0.0008, 0.0004,
  0.0002, 0.0001];

assertBucketCount(Y_, "CIE Y observer");

const Z_ = [0.0007, 0.0105, 0.086, 0.3894, 0.9725, 1.5535, 1.9673, 1.9948,
  1.7454, 1.3176, 0.7721, 0.4153, 0.2185, 0.112, 0.0607, 0.0305, 0.0137, 0.004,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

assertBucketCount(Z_, "CIE Z observer");

export const D65X = D65.map((v, i) => v * X_[i]);
export const D65Y = D65.map((v, i) => v * Y_[i]);
export const D65Z = D65.map((v, i) => v * Z_[i]);

// Imaginary K/S curves.
// K is the "absorption" and S is the "scattering" for the pigment.
export const WHITE = {
  k: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  s: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] ,
};

assertBucketCount(WHITE.k, "white K");
assertBucketCount(WHITE.k, "white S");

export const YELLOW = {
  k: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  s: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] ,
}

assertBucketCount(YELLOW.k, "yellow K");
assertBucketCount(YELLOW.s, "yellow S");

export const BLUE = {
  k: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  s: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] ,
}

assertBucketCount(BLUE.k, "blue K");
assertBucketCount(BLUE.s, "blue S");
