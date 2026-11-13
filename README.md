# AirScript — Write in the Air, See It on Screen

**Tagline:** *Your Finger Is the Pen. The Air Is Your Canvas.*

AirScript is a privacy-first, client-side computer vision web application that turns your webcam into an invisible air pen. Powered by **MediaPipe Tasks Vision (Hand Landmarker)** and the **HTML5 2D Canvas API**, it tracks 21 hand landmarks in real time and converts natural finger gestures into smooth, responsive digital handwriting directly inside your browser—with zero backend servers or video uploads.

---

## Features

- **Real-Time 21-Point Hand Tracking**: Tracks wrist, thumb, index, middle, ring, and pinky landmarks directly in the browser via WebAssembly + WebGL/GPU (with automatic CPU fallback).
- **Intelligent Gesture Recognition with Hysteresis**:
  - **Index Finger Up**: Write or erase directly by pointing your index finger.
  - **Open Palm (2+ Fingers)**: Lift the pen and move the cursor freely without drawing.
  - **Closed Fist**: Pause drawing immediately and finalize the active stroke.
- **Adaptive One-Euro Smoothing & Quadratic Bezier Engine**: Suppresses micro-jitter at low speeds while keeping rapid handwriting responsive and smooth.
- **Complete Drawing Workspace**:
  - Pen & precision `destination-out` Eraser tools
  - 8 curated color swatches + custom native color picker
  - Small / Medium / Large brush presets + custom size slider (`2px–36px`)
  - Canvas background modes: Dark, White, and Transparent (checkerboard preview)
  - Stroke-level **Undo (`Ctrl+Z`)**, **Redo (`Ctrl+Y`)**, **Clear (`C`)** with confirmation modal, and clean **PNG Export** (exports artwork only, without webcam or cursor overlays)
  - Proportional canvas resizing so existing drawings never distort when resizing your browser window
- **Privacy & Security**: All webcam frames are processed locally in memory. Nothing is recorded, stored, or transmitted to any server.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Computer Vision**: `@mediapipe/tasks-vision` (`HandLandmarker`, 21 landmarks)
- **Graphics**: HTML5 Canvas 2D Context (offscreen stroke compositing + quadratic Bezier interpolation)
- **Camera**: WebRTC (`navigator.mediaDevices.getUserMedia`)
- **Icons**: Lucide React

---

## Project Structure

```
airscript/
├── index.html
├── package.json
├── vite.config.ts
├── metadata.json
├── .github/workflows/deploy.yml
├── public/
│   └── mediapipe/
│       ├── wasm/                  # Self-hosted MediaPipe WASM runtime
│       └── models/                # hand_landmarker.task model asset
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/airwrite.ts
    ├── modules/
    │   ├── camera.ts              # WebRTC webcam stream & error management
    │   ├── handTracking.ts        # MediaPipe HandLandmarker GPU/CPU wrapper
    │   ├── gestureDetection.ts    # Normalized multi-landmark gesture classifier
    │   ├── drawingEngine.ts       # Stroke history, Bezier smoothing & PNG export
    │   ├── canvasControls.ts      # Tool state, ResizeObserver & keyboard shortcuts
    │   └── uiController.ts        # RAF loop, tab visibility & resource cleanup
    ├── utils/
    │   ├── coordinates.ts         # Mirrored aspect-aware coordinate mapping
    │   ├── smoothing.ts           # Adaptive 2D One-Euro filter
    │   └── helpers.ts             # Browser support & camera error translation
    └── components/
        ├── Header.tsx
        ├── Toolbar.tsx
        ├── WebcamPreview.tsx
        ├── SidePanel.tsx
        ├── Modals.tsx
        └── ToastContainer.tsx
```

---

## Local Installation & Development

### Prerequisites

- Node.js `18+` (or `20+` recommended)
- A modern browser (Chrome, Edge, or Firefox) with a working webcam

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server on http://localhost:3000
npm run dev

# 3. Type-check and build for production
npm run lint
npm run build
```

> **Note on HTTPS:** Browsers allow `getUserMedia()` on `http://localhost` for local development. In production, the site must be served over **HTTPS** (which GitHub Pages provides automatically).

---

## Gesture Control Guide

| Gesture | Hand Pose | Canvas Behavior |
| :--- | :--- | :--- |
| **Index Finger Up** | Index finger extended, middle/ring/pinky folded | Writes or erases continuously in real time |
| **Open Palm (2+ Fingers)** | Open hand or 2+ fingers extended | Lifts pen and moves cursor without drawing |
| **Closed Fist** | All fingers curled into palm | Pauses drawing safely and closes active stroke |

### Keyboard Shortcuts

- `P` — Switch to Pen tool
- `E` — Switch to Eraser tool
- `Ctrl + Z` (or `Cmd + Z`) — Undo last stroke
- `Ctrl + Y` (or `Ctrl + Shift + Z`) — Redo stroke
- `C` — Request Clear Canvas

---

## Application Screenshots

> *Add screenshots of your deployed AirScript workspace here (e.g., `docs/screenshot-workspace.png`, `docs/screenshot-gestures.png`).*

---

## Troubleshooting

- **Camera permission denied**: Click the camera/lock icon in your browser's address bar, allow Camera access for the site, and click **Start Camera** again.
- **Camera in use by another app**: Close video conferencing apps (Zoom, Microsoft Teams, Google Meet, OBS) or other browser tabs using your webcam.
- **Tracking feels jittery or too sensitive**: Open **Settings** in the header and raise **Adaptive Stroke Smoothing**.
- **Slow frame rate on older laptops**: Open **Settings** and switch **Inference Backend** to `CPU` and **Target Tracking Rate** to `24 FPS`.
- **Hand not detected reliably**: Ensure even front lighting, avoid bright windows directly behind your hand, and keep your full palm inside the webcam frame.

---

## GitHub & GitHub Pages Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: AirScript"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

### 2. Configure Base Path & Deploy to GitHub Pages

`vite.config.ts` is configured with `base: process.env.VITE_BASE_PATH || './'`, which resolves relative asset paths cleanly for both root domains and repository subpaths (`https://<username>.github.io/<repo-name>/`).

If you prefer an explicit repository base path during build:

```bash
VITE_BASE_PATH=/airscript/ npm run build
```

This repository includes `.github/workflows/deploy.yml` to automatically build and deploy `dist/` to **GitHub Pages** whenever you push to `main`:

1. Push your repository to GitHub.
2. Go to **Repository Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Every push to `main` builds the app (including self-hosted MediaPipe WASM and `hand_landmarker.task` assets) and publishes over HTTPS.
