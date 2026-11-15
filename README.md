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

## Layout

```
src/
  app/            route table and application shell (status bar, sidebar, crew selector)
  shared/         design tokens, UI kit, types, API client, mock mode, contexts
  modules/
    crew/         Module 1 — Crew status and health tracking (built)
    assistant/    Module 3 — Crew assistant (built)
```

Anatomy lab and Evidence library show a placeholder until their modules are added. Modules never import from each other; they link through routes.

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


## Crew status (`/crew`)

The ranked roster opens profiles with latest vitals, 24-hour sparklines, live telemetry, Recharts trends, a searchable health log, and editable crew review bands. Deep links: `/crew/:id/log` and `/crew/:id/bands`. Overview logging defaults to the active viewer; logging from another profile requires explicitly choosing the subject. Paired blood-pressure readings share a `pairId`; partial failures can retry the remaining reading.

- **Product rules:** inclusive min/max bands; readings outside by at most 10% of the span are caution, beyond that critical. Stale values become no-data. Wellbeing never drives ranking. Alerts require the configured consecutive count. Trend comparisons use daily means over 7 versus 21 days.
- **Visibility:** stress, fatigue and sleep quality are filtered in mock services and at rendering boundaries. Viewer changes clear old query results. There is no sign-in on this device. Visibility rules control what the screen shows; they are not security. The server must enforce the same visibility and write policies.
- **API:** services use the brief's `/api/crew/*` and `/api/alerts/*` contracts, with `X-Orbit-Viewer` on JSON requests. Native EventSource cannot set headers, so `/api/telemetry/stream` receives `crew` and `viewer` query parameters. Reconnection backs off from 1 to 30 seconds. No third-party hosts are contacted.
- **Synthetic mode:** 30 days of seeded data, relative to page-load time. TALON is critical, HALO caution, IRIS stale, VEGA nominal. HALO's demo SpO₂ band is 91.8–100: the brief's example 94–100 band would make 91–92 critical under its specified formula. These are synthetic product settings, never clinical guidance. Mock writes are session-memory only and reset on reload; persistent real records belong to the backend.
- **Development states:** append `?state=loading`, `?state=empty`, or `?state=error` to overview or profile routes. Browser offline mode pauses the demo wearable; locally loaded mock screens remain usable. This module does not install a service worker or guarantee a cold offline page load.
- **Checks:** `npm test` covers status boundaries, missing/stale readings, wellbeing exclusion, sustained trends, scenario ranking, privacy, and acknowledgements. Run `npm run typecheck`, `npm run build`, and `npm run lint` before integrating.

Backend integration is required to validate real writes, permission enforcement and wearable SSE. Profile queries follow pagination cursors with cancellation and repeated-cursor protection.
