# MotionPlus Pro

A phone- and tablet-friendly app from MotionPlus Physio for digital rehabilitation assessments, with posture, gait and goniometer tools in a premium Tools space.

## What it does

- **39 built-in assessments** across physiotherapy, occupational therapy, neurology, speech and swallowing, behavioural, sensory and paediatrics (Berg, Tinetti, TUG, 6MWT, ROM, MMT, Barthel, FIM, PHQ-9, FOIS, EAT-10, GRBAS and more). Each scores itself, shows its risk band and flags clinically meaningful change.
- **Template maker:** build custom forms by hand, or from a photo or description using AI.
- **AI-written reports** (single assessment or progress), editable before saving.
- **Branded PDF reports** with the MotionPlus Physio watermark and an optional clinic logo.
- **Privacy:** patients are identified by code, never by name. Records stay on the device; encrypted backup files move patients between branch devices.

Licensed instruments (FIM, MoCA, Oswestry, NDI, QuickDASH, Fugl-Meyer) are score-entry only and do not reproduce the official item wording.

## Tools (posture and gait)

The **Tools** tab holds Posture Analysis and Gait Analysis. Both also appear in the assessment list and on each patient's page. A tool opens the posture engine (`posture/`) in a frame for the chosen patient; when the clinician taps **Save to record**, the score, findings, focus areas, key measures and a compressed session (landmarks only, never photos or video) are saved as an ordinary assessment. That means they show in the patient's history, charts, PDFs, AI reports and backups, and **Open in Tools** reopens them for editing. Earlier posture and gait records become the tool's Progress history.

`posture/` still works on its own, with its own sign-in, at `/posture/`.

`sw.js` keeps the app working offline and caches the pose model and libraries after the first visit. Change `VERSION` in it when the model or libraries change.

### Goniometer

The third tool measures joint range of motion two ways, built natively into the app (`src/gonio.js`, inserted at `/*GONIO*/` in `src/app.js` by `build.py`):

- **Camera angle**: three points on a live frame or uploaded photo. The on-device pose model (`posture/vision_bundle.mjs`) places them; the clinician drags any point to correct it.
- **Phone tilt**: the phone's orientation sensor, zeroed at the start position. The angle is the change in the phone's "up" direction, it auto-captures after about a second held still, and lumbar flexion uses the two-reading (T12 minus sacrum) method.

Each of the 23 movements in the Range of Motion template opens on the method suited to it (`GZ_SPEC`), with the reason and set-up shown. Rotations, forearm and neck use phone tilt; plane movements use the camera. Readings (best of up to 3 trials) are saved into the patient's **Range of Motion (Goniometry)** assessment for the day, merging with one already started, with the method noted in `values.gonio` and the clinical notes. Photos are never stored.

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
