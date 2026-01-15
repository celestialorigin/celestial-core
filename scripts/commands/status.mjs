import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function latestFile(dir) {
  if (!exists(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f));

  if (files.length === 0) return null;

  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0];
}

export async function runStatus() {
  const branch = sh("git rev-parse --abbrev-ref HEAD");
  const dirty = sh("git status --porcelain");
  const head = sh('git log -1 --pretty=format:"%h %s"');

  // ahead/behind
  let aheadBehind = "";
  try {
    sh("git fetch --quiet");
    const ab = sh("git rev-list --left-right --count origin/main...HEAD");
    // format: "<behind>\t<ahead>"
    const [behind, ahead] = ab.split(/\s+/);
    aheadBehind = `ahead ${ahead}, behind ${behind}`;
  } catch {
    aheadBehind = "(could not compute ahead/behind)";
  }

  const root = process.cwd();
  const latestDialogue = latestFile(path.join(root, "src", "content", "dialogues"));
  const latestActivity = latestFile(path.join(root, "src", "content", "activities"));

  console.log("🛰️  CELESTIAL STATUS");
  console.log(`- branch: ${branch}`);
  console.log(`- state: ${dirty ? "DIRTY" : "CLEAN"}`);
  console.log(`- sync: ${aheadBehind}`);
  console.log(`- head: ${head}`);
  console.log("");
  console.log("📌 latest content:");
  console.log(`- dialogue: ${latestDialogue ? path.relative(root, latestDialogue) : "(none)"}`);
  console.log(`- activity: ${latestActivity ? path.relative(root, latestActivity) : "(none)"}`);
}
