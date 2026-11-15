import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import vm from "node:vm";

const root = fileURLToPath(new URL("../ui/", import.meta.url));

test("retained health screens render and removed routes and commands are unavailable", async () => {
  const events = { addEventListener() {}, dispatchEvent() {}, removeEventListener() {} };
  const storage = new Map();
  const context = vm.createContext({
    ...events, console, Date, URLSearchParams, URL, FormData, crypto, structuredClone,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
    Event: class {}, CustomEvent: class {},
    location: { hash: "#status" }, navigator: {},
    document: {
      ...events, getElementById: (id) => id === "modal" ? events : null,
      querySelector: (selector) => ["#modal", ".mobile-scrim"].includes(selector) ? events : null,
      querySelectorAll: () => [], hidden: false,
    },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext("window = globalThis;", context);
  const html = await readFile(resolve(root, "index.html"), "utf8");
  for (const [, name] of html.matchAll(/<script src="([^"]+)" defer>/g)) {
    let source = await readFile(resolve(root, name), "utf8");
    if (name === "app.js") source = source.slice(0, source.indexOf("hydrateIcons();persist();render();"));
    vm.runInContext(source, context, { filename: name });
    if (name === "app.js") break;
  }
  for (const page of ["missionStatusPage", "crewDashboardPage", "logPage", "trendsPage", "routinePage", "carePage", "missionWellbeingPage", "missionExercisePage", "skinPage", "missionRisksPage", "anatomyLabPage", "missionResearchPage", "voicePage"]) {
    assert.ok(vm.runInContext(`${page}()`, context).includes("<"), page);
  }
  assert.ok(vm.runInContext("MissionLogic.reportSections(missionReportData()).length", context) > 0);
  vm.runInContext(await readFile(resolve(root, "condition-anatomy.js"), "utf8"), context);
  vm.runInContext(await readFile(resolve(root, "assistant-features.js"), "utf8"), context);
  vm.runInContext(await readFile(resolve(root, "assistant-actions.js"), "utf8"), context);
  for (const page of ["solar-system", "supplies", "earthlink", "brief", "systems", "model", "overview"]) {
    context.location.hash = `#${page}`;
    assert.equal(vm.runInContext("currentPage()", context), "status");
    assert.throws(() => vm.runInContext(`OrbitSiteActions.validate({kind:'navigate',page:'${page}'})`, context));
    assert.ok(!html.includes(`data-nav="${page}"`));
  }
});

test("every local stylesheet, script, font, and offline shell asset exists", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  for (const [, url] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    if (/^(?:https?:|data:|mailto:|tel:|#|\/voice\/)/.test(url)) continue;
    assert.ok((await stat(resolve(root, url.split(/[?#]/)[0]))).isFile(), url);
  }
  const fonts = await readFile(resolve(root, "assets/fonts.css"), "utf8");
  for (const [, url] of fonts.matchAll(/url\(([^)]+)\)/g)) {
    assert.ok((await stat(resolve(root, "assets", url.replace(/["']/g, "")))).isFile(), url);
  }
  const worker = await readFile(resolve(root, "sw.js"), "utf8");
  const shell = worker.slice(worker.indexOf("const SHELL"), worker.indexOf("const ANATOMY"));
  for (const [, url] of shell.matchAll(/'\.\/([^']+)'/g)) {
    assert.ok((await stat(resolve(root, url))).isFile(), url);
  }
});

test("all imported application scripts have valid JavaScript syntax", async () => {
  for (const name of await readdir(root)) {
    if (!/\.m?js$/.test(name)) continue;
    // Some .js files are ES modules loaded dynamically by the classic scripts.
    const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
      input: await readFile(resolve(root, name)), encoding: "utf8",
    });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  }
});

test("all anatomy geometry chunks referenced by the atlases are included", async () => {
  for (const [atlasName, prefix] of [["atlas.json", "body"], ["expanded-atlas.json", "expanded"]]) {
    const atlas = JSON.parse(await readFile(resolve(root, "models", atlasName), "utf8"));
    const chunks = new Map();
    for (const part of atlas.parts) {
      if (!chunks.has(part.chunk)) {
        const chunk = prefix === "body" ? `body-${part.chunk}` : part.chunk;
        const file = resolve(root, "models", `${chunk}.bin`);
        chunks.set(part.chunk, (await stat(file)).size);
      }
      for (const [offset, bytes, count] of [
        [part.positions, 4, part.vertexCount * 3],
        [part.normals, 2, part.vertexCount * 3],
        [part.indices, 4, part.indexCount],
      ]) {
        assert.ok(Number.isInteger(offset) && offset >= 0, part.id);
        assert.ok(offset + bytes * count <= chunks.get(part.chunk), `${part.id}: truncated geometry`);
      }
    }
  }
});
