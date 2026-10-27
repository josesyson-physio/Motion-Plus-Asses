# Anatomy credits

All 3D anatomy in MotionPlus comes from **BodyParts3D**, © The Database Center for Life Science, licensed under
[Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
([dataset](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), [licence](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)).
Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

The models are a guide for explaining a condition to a patient. They are an adult male reference, not the patient's own body, and are not a diagnostic tool.

## Files

- `knee-1.bin`, `hip-1.bin`, `ankle-1.bin`, `shoulder-1.bin`, `elbow-1.bin`, `lumbar-1.bin`, `neck-1.bin`, `body-2.bin`: BodyParts3D geometry as published by
  [open-anatomy-3d](https://github.com/MervinR07/open-anatomy-3d), adapted (see below).
- `detail-1.bin`: named muscles, arteries (brain, heart, aorta, legs), vertebrae, intervertebral discs and heart valves. BodyParts3D 4.0 geometry and English names
  as prepared by **Human Atlas** ([human-atlas.online](https://human-atlas.online/), [source](https://github.com/ashemag/human-atlas)).
  Only the openly licensed anatomy data was used; no Human Atlas application code or design is included. Built with `tools/detail.py`.

## Changes we made

- Selected a subset of structures for each view; converted metres to millimetres; simplified meshes further for phones;
  quantised positions to 0.1 mm; packed into our own binary format.
- Brain areas, skin areas (dermatomes) and the nerve lines in `body-2.bin` are drawn approximately for explanation and are labelled as a guide.
- Display colours are ours and are not photographic.

## Human Atlas licence (MIT)

The Human Atlas preparation of the data was obtained from a project released under the MIT License:

> MIT License
>
> Copyright (c) 2026 ashemag
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
