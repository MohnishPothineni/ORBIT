# ORBIT | Crew Health

A local-first, offline-capable crew medical and mission operations console. After setup it runs entirely on the local network: no CDN fonts, scripts or analytics, and nothing is sent anywhere without an explicit action by a person.

The app does not diagnose, does not assess fitness for duty and is not clinically validated.

## Stack

React 18 · TypeScript (strict) · Vite · Tailwind CSS v4 · lucide-react · react-router-dom v6. Fonts are bundled through `@fontsource`. All dependency versions are pinned exactly.

The backend (Python, FastAPI, Uvicorn, Pipecat) serves the built frontend and `/api/*` over local HTTPS on the same origin. In development, Vite proxies `/api` to `https://localhost:8443`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. `.env.development` sets `VITE_USE_MOCKS=true`. |
| `npm run build` | Typecheck, then production build to `dist/`. |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Regression tests for microphone races, session cleanup, tool history, and input validation. |

## Layout

```
src/
  app/            route table and application shell (status bar, sidebar, crew selector)
  shared/         design tokens, UI kit, types, API client, mock mode, contexts
  modules/
    anatomy/      Module 2 — Anatomy lab (built)
    assistant/    Module 3 — Crew assistant (built)
```

Crew status and Evidence library show a placeholder until their modules are added. Modules never import from each other; they link through routes.

## Crew assistant (`/assistant`)

A real-time voice and text assistant on the local network. The server pipeline runs SmallWebRTC → Silero VAD → Smart Turn v3 → local STT → Ollama `qwen3:8b` → Kokoro TTS.

- **Adapter boundary:** all Pipecat API use lives in `modules/assistant/pipecat/`. The rest of the module only talks to the `VoiceSession` interface (`session/VoiceSession.ts`).
- **Signaling:** SDP offer to `POST /api/voice/offer`, `iceServers: []` (host candidates only).
- **No CDN:** the transport's default media manager wraps daily-js, which loads code from Daily's CDN. ORBIT uses its own `getUserMedia` media manager instead, and `vite.config.ts` aliases daily-js to a stub so that code isn't bundled.
- **Human confirmation:** `log_vital` waits for a person to press **Save**. `share_record_with_assistant` waits for the review dialog's **Share** button, or for the exact spoken phrase "Confirm share". Model output and typed text can never approve.
- **Session rules:**
  - The session ends when the active crew member changes or when you leave the page.
  - Hiding the tab mutes the microphone; returning does not unmute it.
  - Start is disabled while the model is not ready.

### Server messages the client understands

Sent as RTVI server messages:

- `{ type: "smart-turn", probability }`
- `{ type: "pipeline-health", health }`
- `{ type: "citations", citations }`
- `{ type: "turn-metrics", stt_ms, llm_ttft_ms, tts_ttfb_ms, voice_to_voice_ms }`

### Client messages the server should handle

- `orbit.voice-settings` (settings without volume; volume is applied in the browser)
- `orbit.interrupt`

### Mock mode

With `VITE_USE_MOCKS=true`, a `MockVoiceSession` plays a scripted conversation without WebRTC:

1. Log a heart rate, with the Save confirmation.
2. Evidence on bone loss, with citations.
3. Show the left knee, which navigates to the Anatomy lab.

A **Demo controls** card can step the script, force any turn state, simulate errors, say the share approval phrase and cycle the status-bar states. Append `?state=loading|empty|error` to the URL in development to see those page states.

## Anatomy lab (`/anatomy`)

An anatomical reference workspace. Crew members inspect body systems, pin symptoms, injuries and observations to a region for one crew member, and cross-reference notes, health-log entries and Evidence library sources for that region.

The model is a **generic adult reference** shared by every profile. Pins change markers and highlights only; they are not a scan, an image or a finding.

| Route | Screen |
|---|---|
| `/anatomy` | Workspace for the active crew member |
| `/anatomy?crew=c03&region=knee_left&pin=p12` | Deep link: selects the crew member in the status bar, frames the region, opens the Pins tab |
| `/anatomy/pins` | All pins across the crew, filterable by crew, status and system |

- **Layout:** Explorer (search, system layers, region tree) · Viewer · Inspector (Region · Pins · Notes & references). Below 1280px the inspector is a slide-over sheet.
- **3D:** three + @react-three/fiber + drei, lazy-loaded so three.js only downloads when the 3D view is used. Loads `/models/anatomy/body.glb` (not committed). Draco decoders live in `public/models/anatomy/draco/`; Meshopt decoding is bundled. Nothing comes from a CDN.
- **2D fallback:** front and back maps projected from the same reference shapes, used automatically when WebGL 2 is unavailable or the GLB is missing or fails to load. Pins work the same way.
- **Placeholder body:** `VITE_ANATOMY_PLACEHOLDER=true npm run dev` renders a procedural body (capsules, spheres and rings named by region id) so the 3D path can be developed without the real asset.
- **Keyboard:** the region tree is a full `role="tree"`. In the viewer, arrows rotate (3D) or pan (2D), `+`/`-` zoom, `0` resets, `F` frames the selection, `Esc` cancels pin placement.
- **Driving the viewer from other modules:** dispatch `window.dispatchEvent(new CustomEvent("orbit:anatomy", { detail: { action: "selectRegion", payload: "knee_left" } }))`. Actions: `selectRegion`, `focusRegion`, `setPreset`, `toggleLayer`, `isolate`, `setSection`, `frameSelection`, `resetView`. The Crew assistant's flat snake_case form (`{ action: "focus_region", region: "knee_left" }`) is accepted too. See `modules/anatomy/public.ts`.
- **API:** `GET /api/anatomy/regions`, `GET|POST /api/anatomy/pins`, `PATCH|DELETE /api/anatomy/pins/{id}`, `GET /api/anatomy/regions/{id}/references?crew=`.
- **Dev overrides:** `?state=loading|empty|error`, and `?webgl=off` to force the 2D fallback.
