// Applies Cedric's r6 source patches (cedric-patches/) before dev/build/check/test.
// Some changed files are too large to commit through Cedric's GitHub connection, so the
// changes live as verified patches. Each target is checked by SHA-256: already patched ->
// skipped; unchanged original -> patched and re-verified; anything else -> hard stop.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(root, "cedric-patches/manifest.json"), "utf8"));
const hash = (p) => createHash("sha256").update(readFileSync(join(root, p))).digest("hex");
let applied = 0;
for (const entry of manifest.files) {
  const current = hash(entry.file);
  if (current === entry.after) continue;
  if (current !== entry.before) {
    console.error(`[cedric-patches] ${entry.file} matches neither the original nor the patched version; stopping so a half-patched build is never produced.`);
    process.exit(1);
  }
  const original = readFileSync(join(root, entry.file));
  try {
    for (const p of entry.patches) {
      execFileSync("git", ["apply", "--whitespace=nowarn", p], { cwd: root, stdio: "inherit" });
    }
    if (hash(entry.file) !== entry.after) throw new Error("result hash mismatch");
  } catch (err) {
    writeFileSync(join(root, entry.file), original);
    console.error(`[cedric-patches] failed on ${entry.file}: ${err.message}. File restored.`);
    process.exit(1);
  }
  applied++;
}
console.log(`[cedric-patches] ${manifest.release}: ${applied} file(s) patched, ${manifest.files.length - applied} already up to date.`);
