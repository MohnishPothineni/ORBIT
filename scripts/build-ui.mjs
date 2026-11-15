import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = new URL("../dist/", import.meta.url);

// Keep the React voice workspace available alongside the complete reference UI.
await build({ root, base: "/voice/", build: { outDir: "dist/voice", emptyOutDir: true } });
await mkdir(output, { recursive: true });
await cp(new URL("../ui/", import.meta.url), output, { recursive: true });
console.log("Built NASA-TEST UI at / and React voice workspace at /voice/.");
