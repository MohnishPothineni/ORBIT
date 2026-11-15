# NASA-TEST interface

The complete frontend from `NASA-TEST/dist` is preserved in the tracked `ui/`
directory. These are the original editable HTML, CSS, JavaScript, fonts, images,
vendored libraries, and anatomy/avatar models. No NASA-TEST environment files,
credentials, runtime records, Git metadata, or node_modules were imported.

Edit `ui/` directly to change the shared design. `DESIGN.md` records the original
design system; third party notices and font licenses are retained here, with
model and library notices next to the corresponding assets in `ui/`.

Run `npm ci`, then `npm run dev` to open this interface at http://localhost:5173.
`npm run build` copies it to `dist/` and builds the React voice workspace at
`dist/voice/`. `npm run preview` serves both outputs. The FastAPI server also
serves both after building. Use `npm run dev:voice` for React voice development.

The imported UI uses hash navigation, local browser records, and its existing
offline preparation controls. Its optional account/passkey, cloud storage,
ElevenLabs, and onboard-assistant API contracts belong to the NASA-TEST backend;
copying the UI does not implement those services in ORBIT's FastAPI backend.
The existing Pipecat voice workspace remains at `/voice/` in the production
build. Development and preview proxy `/api/*` to https://localhost:8443.

To pull the shared UI: `git switch main`, `git pull origin main`, `npm ci`, then
`npm run dev`. The full 3D geometry is committed so no separate asset download
or local NASA-TEST folder is required.
