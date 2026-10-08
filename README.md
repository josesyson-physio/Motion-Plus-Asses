# MotionPlus Assess

A phone- and tablet-friendly app from MotionPlus Physio for digital rehabilitation assessments.

## What it does

- **39 built-in assessments** across physiotherapy, occupational therapy, neurology, speech and swallowing, behavioural, sensory and paediatrics (Berg, Tinetti, TUG, 6MWT, ROM, MMT, Barthel, FIM, PHQ-9, FOIS, EAT-10, GRBAS and more). Each scores itself, shows its risk band and flags clinically meaningful change.
- **Template maker:** build custom forms by hand, or from a photo or description using AI.
- **AI-written reports** (single assessment or progress), editable before saving.
- **Branded PDF reports** with the MotionPlus Physio watermark and an optional clinic logo.
- **Privacy:** patients are identified by code, never by name. Records stay on the device; encrypted backup files move patients between branch devices.

Licensed instruments (FIM, MoCA, Oswestry, NDI, QuickDASH, Fugl-Meyer) are score-entry only and do not reproduce the official item wording.

## Where it runs

The live app is published as a Claude artifact. AI features and file saving need the Claude viewer. `index.html` opens in any browser for everything else.

## MotionPlus Posture

`posture/` is a separate static posture assessment app: front, back and side photos, on-device body landmark detection (MediaPipe), Kendall plumb-line analysis, a colour-coded body map with treat and train regions, and a graphics-only PDF report. Photos never leave the device.

It is a plain static site, so any web host serves it. With GitHub Pages turned on for this repository it opens at `https://josesyson-physio.github.io/Motion-Plus-Asses/posture/`, where the phone camera, photo upload and PDF download work directly, and it can be added to the home screen.

## Project layout

| Path | Contents |
| --- | --- |
| `index.html` | The built app, a single self-contained file |
| `src/shell.html` | Page structure and styles |
| `src/templates.js` | The assessment library |
| `src/app.js` | Screens, scoring, AI reports, PDF and backup |
| `assets/motionplus-logo.jpg` | Brand logo |
| `src/posture.html` | Posture app page (also published as a Claude artifact) |
| `posture/` | Built posture app with its pose model and runtime files |
| `build.py` | Rebuilds `index.html` and `posture/index.html` from `src/` |

To rebuild after editing `src/`, run `python3 build.py`.
