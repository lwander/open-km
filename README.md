# Kubelka-Munk in GLSL

This repository contains a working implementation of Kubelka-Munk theory, but
with fake K/S data. This being released as an educational guide, and to help
those interested in developing their own imaginary pigments.

## Background

[Kubelka-Munk theory](https://en.wikipedia.org/wiki/Kubelka%E2%80%93Munk_theory)
models the color of a mixture of pigments. To do so, it uses information about
the pigments in the form of their K (absorption) and S (scattering) curves.
These curves relate wavelengths of light (typically in the visible spectrum) to
the amount of light absorped or scattered.

Kubelka-Munk theory is both effective and efficient when it comes to simulating
pigment mixtures. However, it is difficult to acquire the needed K & S curves
to perform this mixing accurately. Doing so by hand requires a lot of careful
data collection and computation (see [this
thesis](https://scholarworks.rit.edu/theses/4892/) for more information). In
addition, the K & S curves are considered to be the IP of the paint
manufacturer, so they are not keen to have them shared once known.

This repository contains an implementation of Kubelka-Munk pigment mixing, but
with fake spectral data for the supplied `WHITE`, `BLUE`, and `YELLOW`
pigments. These fake spectral curves look like this:

![white_ks](/doc/white_ks.png)

![yellow_ks](/doc/yellow_ks.png)

![blue_ks](/doc/blue_ks.png)

These approxmiate white, yellow, and blue, but when mixed still create grey:

![mixture](/doc/mixture.png)

To perform more interesting or convincing mixing, better spectral data is
needed. Feel free to contribute improved K/S curves if you develop them. __Do
not__ contribute curves that may be considered IP.

## Running

You can demo the pigment mixing in your browser. For convenience sake, the
`serve` script runs a Python HTTP server in this directory:

```bash
$ ./serve
$ # open http://localhost:9119 in your browser
```

## Contributing

Try changing the colors (or adding more) in `consts.js`. These are interpreted
and mixed in the fragment shader in `km.js`.

## Resources

- Spectral data source: https://cie.co.at/data-tables.
- Overview of KM mixing: https://scholarworks.rit.edu/theses/4892/
