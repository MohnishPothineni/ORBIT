import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { chunkId, exportResearch, OUTPUT } from "../scripts/export-research.mjs";

test("the voice assistant's evidence matches the website's Evidence library", async () => {
  // Fails when ui/research-library.js changes without re-running the export (npm run build).
  assert.equal(await readFile(OUTPUT, "utf8"), exportResearch());
});

test("every exported passage has a unique, linkable id", () => {
  const { passages } = JSON.parse(exportResearch());
  assert.ok(passages.length > 0);
  const ids = passages.map((p) => `${p.documentId}/${p.chunkId}`);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of passages) {
    assert.match(p.chunkId, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(chunkId(p.title.replace(/ \([^)]*\)$/, "")), p.chunkId);
    assert.ok(p.sources.length > 0 && p.excerpt.length > 0);
  }
});
