// Fetch the upstream CLIProxyAPI model catalog and add a Mythos copy of every Fable entry.
// node scripts/patch-models.mjs <out file>
import fs from "node:fs";

const SOURCES = [
  "https://raw.githubusercontent.com/router-for-me/models/refs/heads/main/models.json",
  "https://models.router-for.me/models.json",
];
const out = process.argv[2];
if (!out) throw new Error("usage: patch-models.mjs <out file>");

let catalog;
for (const url of SOURCES) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    catalog = await res.json();
    console.log(`fetched ${url}`);
    break;
  } catch (err) {
    console.warn(`fetch failed: ${url}: ${err.message}`);
  }
}
if (!catalog) throw new Error("all upstream sources failed");
if (!Array.isArray(catalog.claude)) throw new Error("upstream catalog has no claude section");

const fable = catalog.claude.filter((m) => /^claude-fable-/.test(m.id));
if (fable.length === 0) throw new Error("no claude-fable-* entries in upstream catalog");

const ids = new Set(catalog.claude.map((m) => m.id));
const added = [];
for (const m of fable) {
  const copy = JSON.parse(JSON.stringify(m).replaceAll("fable", "mythos").replaceAll("Fable", "Mythos"));
  if (ids.has(copy.id)) {
    console.log(`skip ${copy.id}: already in upstream`);
    continue;
  }
  const at = catalog.claude.findIndex((x) => x.id === m.id) + 1;
  catalog.claude.splice(at, 0, copy);
  ids.add(copy.id);
  added.push(copy.id);
}
console.log(`added: ${added.join(", ") || "(none)"}`);

fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + "\n");
