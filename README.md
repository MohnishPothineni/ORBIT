# ORBIT | Crew Health

A local-first, offline-capable crew medical and mission operations console. After setup it runs entirely on the local network: no CDN fonts, scripts or analytics, and nothing is sent anywhere without an explicit action by a person.

The app does not diagnose, does not assess fitness for duty and is not clinically validated.

## Shared website design

The NASA-TEST design is tracked in `ui/` and is the default website. The app
contains Anatomy Lab, crew status and health tracking, the crew voice assistant,
and the offline evidence library, with their supporting fonts, images and 3D models.
Run `npm ci` and `npm run dev`, then open http://localhost:5173.
Edit `ui/` to change the design; do not edit the generated `dist/` folder.
See [UI setup and provenance](docs/ui-reference/README.md) and the retained
[design system](docs/ui-reference/DESIGN.md).

The existing React/Pipecat workspace is preserved at `/voice/` after building.
The website's **Crew voice AI assistant** tab (`#voice`, `ui/voice.js`) embeds it as
`/voice/assistant?embed=1`, so it shares the website's sidebar, top bar, page heading
and colors (`ui/design-tokens.css` is imported by both apps). In that mode the
workspace hides its own shell, and its links open the website's tabs. Re-renders keep
the frame, so a live voice session is not interrupted.
The local FastAPI server implements the React voice workspace's API. The
floating avatar assistant uses ElevenLabs and requires internet access.

## Stack

React 18 · TypeScript (strict) · Vite · Tailwind CSS v4 · lucide-react · react-router-dom v6. Fonts are bundled through `@fontsource`. All dependency versions are pinned exactly.

The backend (Python, FastAPI, Uvicorn, Pipecat) serves the built frontend and `/api/*` over local HTTPS on the same origin. In development, Vite proxies `/api` to `https://localhost:8443`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Build the voice workspace, then serve the core UI at http://localhost:5173. |
| `npm run dev:live` | Same UI, with `/api` proxied to the local server. |
| `npm run dev:voice` | Vite development server for the React voice workspace in live mode. |
| `npm run server` | Starts the local Python server (`server/run.py`) on `https://localhost:8443`. |
| `npm run build` | Typecheck; copy `ui/` to `dist/`; build React at `dist/voice/`. |
| `npm run preview` | Serve the complete production build at http://localhost:5173. |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Regression tests for microphone races, session cleanup, tool history, and input validation. |

## Local server (`server/`)

FastAPI + Pipecat, all on this machine. It implements the React voice workspace?s `/api/*` routes and serves `dist/` after `npm run build`.

For a step-by-step guide to setting up and running the offline voice assistant (Ollama, Whisper speech to text, Kokoro text to speech), see [docs/OFFLINE-ASSISTANT.md](docs/OFFLINE-ASSISTANT.md).

**One-time setup**

1. Install [Ollama](https://ollama.com) and pull the model: `ollama pull qwen3:8b`
2. Create a Python 3.12 environment and install: `pip install -r server/requirements.txt`
3. Download the models once (needs internet): set `ORBIT_ALLOW_DOWNLOADS=1` in `server/.env`, start the server, open a session, then remove the line. Or point `ORBIT_KOKORO_MODEL` / `ORBIT_KOKORO_VOICES` at existing Kokoro files. See `server/.env.example`.

**Run**

```
npm run server        # terminal 1: https://localhost:8443
npm run dev:voice     # terminal 2: http://localhost:5173, proxies /api to the server
```

Or `npm run build` and open `https://localhost:8443` directly (also from other devices on the LAN). The HTTPS certificate is self-signed and created on first run (`server/certs/`); accept it once in the browser. Browsers only allow the microphone over HTTPS or on `localhost`.

**Pipeline:** SmallWebRTC → Silero VAD → fixed-silence end of turn (`ORBIT_SILENCE_SECONDS`, default 1 s) → faster-whisper `base.en` → Ollama `qwen3:8b` (thinking off) → Kokoro. The server reports this as its turn detection ("Silence timer · 1 s"), and the status panel shows that rather than Smart Turn.

**Tools** run in the browser. The server advertises them to the model (`server/orbit_server/tools.py`) and relays each call to the page and its result back. `log_vital` and `share_record_with_assistant` survive interruptions and wait for a person. The browser gives up after 4 min 45 s and tells the model nothing was saved or shared, before the server's 5-minute backstop, so no Save button outlives the request.

**Data:** the voice assistant's crew are the website's demo crew, with the same ids: Crew 01 to 04 (`crew-01`…`crew-04`, fictional sample crew whose readings the server dates today) and the historical profiles Gordon Cooper (`hist-ma9`) and Scott Carpenter (`hist-ma7`). `node scripts/seed-voice-crew.cjs` rebuilds `server/data/seed.json` from the website's own scripts, and `npm test` fails if the two drift apart. The React mock mode keeps its own synthetic crew (`src/shared/mocks/crew.ts`). Saved vitals and voice settings go to `server/data/runtime/` (gitignored).

**Evidence:** the assistant searches the website's Evidence library. `scripts/export-research.mjs` exports `ui/research-library.js` to `server/data/research-library.json` (run by `npm run build`; the file is committed, and `npm test` fails if it falls out of date). Each passage carries its evidence type, tracking guidance and source papers. Citations link to `#research?doc=<topic>&chunk=<entry>`, which opens that entry. Search is keyword matching; there is no FAISS index yet, so the status bar reports the index as missing.

**Anatomy lab** (`/api/anatomy/*`, `server/orbit_server/anatomy.py`) serves the React Anatomy lab module. Regions come from the module's own `src/modules/anatomy/mocks/regions.json`. Pins start from the synthetic `server/data/anatomy-pins.json`, and changes are saved to `server/data/runtime/anatomy-pins.json`. Region references list pin notes only.

**Ask the onboard library** (`/api/assistant/status`, `/api/assistant/ask`, `server/orbit_server/onboard_library.py`) powers the panel on the website's Evidence library page. It answers from the matching library passages with the local model and streams the answer with its sources. If nothing in the library matches, the model is not called and the answer is marked as not covered.

**Shared records** belong to the voice session they were shared with (keyed by its WebRTC `pc_id`). They reach only that session's prompt, framed as data rather than instructions, and are dropped when that session ends or the person removes them.

**Voice settings** applied live: voice, speed, response length and VAD sensitivity. Blend is reported as unsupported. Interruptions on/off and end-of-turn threshold take effect for the next session and are ignored respectively.

## Layout

```
server/
  run.py          starts uvicorn over HTTPS
  orbit_server/   app.py (routes) · voice.py (pipeline) · tools.py · store.py · health.py · certs.py
  data/           seed.json (synthetic); runtime/ for saved vitals and settings
src/
  app/            route table and application shell (status bar, sidebar, crew selector)
  shared/         design tokens, UI kit, types, API client, mock mode, contexts
  modules/
    crew/         Module 1 — Crew status and health tracking (built)
    anatomy/      Module 2 — Anatomy lab (built)
    assistant/    Module 3 — Crew assistant (built)
```

All four modules are registered in the React application. Modules never import from each other; they link through routes.

## Crew assistant (`/assistant`)

A real-time voice and text assistant on the local network. The target pipeline is SmallWebRTC → Silero VAD → Smart Turn v3 → local STT → Ollama `qwen3:8b` → Kokoro TTS. The bundled server (above) uses a silence timer in place of Smart Turn for now.

- **Adapter boundary:** all Pipecat API use lives in `modules/assistant/pipecat/`. The rest of the module only talks to the `VoiceSession` interface (`session/VoiceSession.ts`).
- **Signaling:** SDP offer to `POST /api/voice/offer`, `iceServers: []` (host candidates only).
- **No CDN:** the transport's default media manager wraps daily-js, which loads code from Daily's CDN. ORBIT uses its own `getUserMedia` media manager instead, and `vite.config.ts` aliases daily-js to a stub so that code isn't bundled.
- **Human confirmation:** `log_vital` waits for a person to press **Save**, or for the exact spoken phrase "Confirm save" (one reading per phrase). `share_record_with_assistant` waits for the review dialog's **Share** button, or for the exact spoken phrase "Confirm share". Model output and typed text can never approve.
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

## Offline evidence library

Module 4 is implemented at `/evidence`, with cited search/Ask, a passage viewer,
Offline center, import/indexing jobs, and a separate historical CSV reference view.
Production builds include a Workbox service worker; live API responses are never
cached. See [the module guide](src/modules/evidence/README.md) for API contracts,
offline behavior, mock-mode limits, tests, and the colon-containing workspace path
caveat. The separate local FastAPI/FAISS/Ollama backend is required for real search,
indexing and generated answers.

Run `npm run build` then `npm run test:evidence` for the evidence regression checks.
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


## Crew status (`/crew`)

The ranked roster opens profiles with latest vitals, 24-hour sparklines, live telemetry, Recharts trends, a searchable health log, and editable crew review bands. Deep links: `/crew/:id/log` and `/crew/:id/bands`. Overview logging defaults to the active viewer; logging from another profile requires explicitly choosing the subject. Paired blood-pressure readings share a `pairId`; partial failures can retry the remaining reading.

- **Product rules:** inclusive min/max bands; readings outside by at most 10% of the span are caution, beyond that critical. Stale values become no-data. Wellbeing never drives ranking. Alerts require the configured consecutive count. Trend comparisons use daily means over 7 versus 21 days.
- **Visibility:** stress, fatigue and sleep quality are filtered in mock services and at rendering boundaries. Viewer changes clear old query results. There is no sign-in on this device. Visibility rules control what the screen shows; they are not security. The server must enforce the same visibility and write policies.
- **API:** services use the brief's `/api/crew/*` and `/api/alerts/*` contracts, with `X-Orbit-Viewer` on JSON requests. Native EventSource cannot set headers, so `/api/telemetry/stream` receives `crew` and `viewer` query parameters. Reconnection backs off from 1 to 30 seconds. No third-party hosts are contacted.
- **Synthetic mode:** 30 days of seeded data, relative to page-load time. TALON is critical, HALO caution, IRIS stale, VEGA nominal. HALO's demo SpO₂ band is 91.8–100: the brief's example 94–100 band would make 91–92 critical under its specified formula. These are synthetic product settings, never clinical guidance. Mock writes are session-memory only and reset on reload; persistent real records belong to the backend.
- **Development states:** append `?state=loading`, `?state=empty`, or `?state=error` to overview or profile routes. Browser offline mode pauses the demo wearable; locally loaded mock screens remain usable. This module does not install a service worker or guarantee a cold offline page load.
- **Checks:** `npm test` covers status boundaries, missing/stale readings, wellbeing exclusion, sustained trends, scenario ranking, privacy, and acknowledgements. Run `npm run typecheck`, `npm run build`, and `npm run lint` before integrating.

Backend integration is required to validate real writes, permission enforcement and wearable SSE. Profile queries follow pagination cursors with cancellation and repeated-cursor protection.

### React crew development

Run `npm run dev:crew` to open the React crew app at `http://127.0.0.1:5173/crew`. After installing dependencies or merging changes to `vite.config.ts`, restart the dev server so it loads the current plugin configuration. `virtual:pwa-register` is generated by `vite-plugin-pwa`; it is not a physical file. The production build retains offline precaching and update notifications.
