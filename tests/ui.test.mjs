import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../ui/", import.meta.url));

test("every local stylesheet, script, font, and offline shell asset exists", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  for (const [, url] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    if (/^(?:https?:|data:|mailto:|tel:|#)/.test(url)) continue;
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
