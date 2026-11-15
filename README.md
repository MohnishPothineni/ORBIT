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
| `npm run dev:live` | Dev server against the real local server (`.env.live` sets `VITE_USE_MOCKS=false`). |
| `npm run server` | Starts the local Python server (`server/run.py`) on `https://localhost:8443`. |
| `npm run build` | Typecheck, then production build to `dist/`. |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Regression tests for microphone races, session cleanup, tool history, and input validation. |

## Local server (`server/`)

FastAPI + Pipecat, all on this machine. It implements every `/api/*` route the frontend calls and serves `dist/` after `npm run build`.

**One-time setup**

1. Install [Ollama](https://ollama.com) and pull the model: `ollama pull qwen3:8b`
2. Create a Python 3.12 environment and install: `pip install -r server/requirements.txt`
3. Download the models once (needs internet): set `ORBIT_ALLOW_DOWNLOADS=1` in `server/.env`, start the server, open a session, then remove the line. Or point `ORBIT_KOKORO_MODEL` / `ORBIT_KOKORO_VOICES` at existing Kokoro files. See `server/.env.example`.

**Run**

```
npm run server        # terminal 1: https://localhost:8443
npm run dev:live      # terminal 2: http://localhost:5173, proxies /api to the server
```

Or `npm run build` and open `https://localhost:8443` directly (also from other devices on the LAN). The HTTPS certificate is self-signed and created on first run (`server/certs/`); accept it once in the browser. Browsers only allow the microphone over HTTPS or on `localhost`.

**Pipeline:** SmallWebRTC → Silero VAD → fixed-silence end of turn (`ORBIT_SILENCE_SECONDS`, default 1 s) → faster-whisper `base.en` → Ollama `qwen3:8b` (thinking off) → Kokoro. The server reports this as its turn detection ("Silence timer · 1 s"), and the status panel shows that rather than Smart Turn.

**Tools** run in the browser. The server advertises them to the model (`server/orbit_server/tools.py`) and relays each call to the page and its result back. `log_vital` and `share_record_with_assistant` survive interruptions and wait for a person. The browser gives up after 4 min 45 s and tells the model nothing was saved or shared, before the server's 5-minute backstop, so no Save button outlives the request.

**Data** is synthetic (`server/data/seed.json`, matching the frontend mocks). Saved vitals and voice settings go to `server/data/runtime/` (gitignored). Evidence search is keyword matching over the local passages; there is no FAISS index yet, so the status bar reports the index as missing.

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
    assistant/    Module 3 — Crew assistant (built)
```

Crew status, Anatomy lab and Evidence library show a placeholder until their modules are added. Modules never import from each other; they link through routes.

## Crew assistant (`/assistant`)

A real-time voice and text assistant on the local network. The target pipeline is SmallWebRTC → Silero VAD → Smart Turn v3 → local STT → Ollama `qwen3:8b` → Kokoro TTS. The bundled server (above) uses a silence timer in place of Smart Turn for now.

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
