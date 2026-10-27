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

## App feel (premium redesign, stage 1)

- **Welcome:** three screens on first open: clinic or individual use, the privacy promise, and the details printed on reports.
- **Today:** the home tab. It shows the assessment in progress, re-tests due (same test 4+ weeks ago), weekly counts and recent results. The gold **+** in the tab bar opens a sheet to start anything.
- **Native feel:** screen slides (forward, back, tab fade), remembered scroll, the phone's back button steps back inside the app, edge-swipe back in the installed iPhone app, bottom sheets instead of drop-downs, segmented controls, count-ups, chart draw-in, and a save tick. Everything follows the phone's Reduce Motion setting.
- **Haptics:** single short pulses on save, warnings and deletes (Android; iPhone browsers don't allow vibration). They can be turned off in Settings.
- **Reliability:** every answer autosaves as a draft, deletes can be undone for 5 seconds, and a banner offers a restart when a new version has installed.
- **Accessibility:** brighter secondary text, a text-size setting (Small to Largest), live score announcements for screen readers.
- **Tests:** `tests/smoke.mjs` walks the main path on a phone-sized screen. CI runs it on every pull request and checks that `index.html` was rebuilt from `src/`.

## Guided sessions (premium redesign, stage 2)

- **Plan:** "Start session" on a patient suggests tests from the diagnosis and earlier visits. For example, a knee diagnosis suggests pain, LEFS, the Goniometer and gait. Tap a test to leave it out, or add one.
- **One question per page:** each item has its own page with a how-to-test tip and safety cues. Some cues come from earlier answers, such as a low Berg item or PHQ-9 item 9 above zero. Choosing an answer moves on, numbered dots jump back to any page, and the last page reviews every answer before saving. Settings can switch back to all questions on one page.
- **Timers:** TUG, 5xSTS and 10MWT get a stopwatch that fills in the time. The 6MWT gets a 6-minute countdown that shows the standard encouragement each minute. A single pulse marks start, stop and each minute.
- **Summary:** each test saves into the record as it is finished. The summary shows the change since last time, and a gold star marks changes beyond the test's MCID.
- **Explain to patient:** a light page in plain words with a body graphic (knee, spine, shoulder, balance, swallowing, heart). It shows "better / about the same / a little harder" and what to work on, and can be sent to the patient. It has no scores or diagnoses, and mood screens are left off it. The PDF stays professional.
- **Timeline:** the patient page groups assessments by visit date.

## Clinical reasoning and goals (premium redesign, stage 3)

- **Goals you write and edit:** on a patient, "+ Write" starts a goal in your own words; "Suggest" offers goals drawn from the latest results (an MCID or cut-off, or +15° for limited range) that you can reword before adding. Every goal can be edited: wording, the test that measures it (or none, if you mark it yourself), start, target, reach-by date and notes. Linked goals update their progress and mark themselves reached when a test is saved. Delete has undo.
- **Possible contributing factors:** findings that need two or more tests pointing the same way (for example leg weakness with poor balance) are listed as possibilities to check, never a diagnosis.
- **Is this change real?:** each result explains whether a change is beyond the MCID or measurement error, whether every item was scored, and whether the assessor or Goniometer method changed. Session summaries label each change.
- **Clinic vs individual:** in clinic mode, Today shows who is assessing (switch from the team list in Settings) and every record and PDF line carries the assessor. Camera tools ask for consent once per patient.
- **Offline:** Today shows when the phone is offline; everything still saves on the device.

## Pilot kit

- **Pilot mode** (Settings, Pilot and feedback): Today shows the pilot day and a "Tell us what to fix" button, and after the first session each day the app asks for a one-tap 1 to 5 rating.
- **Feedback:** choose Something broke, Confusing, Idea or I like this, write a note and optionally rate the day. Each note records the screen, phone type, screen size and app version, never patient details. Notes stay on the phone until the tester taps Send, which opens the share sheet (or the pilot lead's email, or copies the text). "Save all as a file" keeps a copy.
- **Errors:** while the pilot runs, unexpected app errors are noted (message and screen only, up to 20) so they go out with the feedback.

## Consultation room

- **Present before printing:** "Consultation room" on a patient (or "Present" on a session summary) opens a full-screen, swipeable presentation for the patient: results as rings, progress charts, a body map of the assessed area, a 3D joint model, the lever and pulley view, how the injury may have happened, contributing factors, goals, the rehab plan, and next steps (PDF, send summary).
- **3D joints:** knee, hip, ankle, shoulder, elbow, lower back and neck. Each model moves through its range with the working muscles shortening and lengthening, and shows the pivot, the muscle's pull and the load with their lever arms. Drag to turn, pinch or scroll to zoom, tap to pause. It uses three.js from cdnjs, cached for offline use after the first open.
- **Lever and pulley:** a 2D diagram names the lever class (first, second or third) for the joint, animates it, lets you slide the load further away and switch the pulley (for example the kneecap) on or off, and shows how hard the muscle has to pull.
- **Possible mechanism of injury:** picked from the diagnosis wording and shown as a four-step flow chart, always worded as a possibility, never a diagnosis.
- **Rehab plan:** four phases with week ranges and exercises, prefilled for the joint. "Edit plan" lets you change the joint, mechanism, current stage, phase names, weeks and exercises. A saved plan prints in the PDF.
