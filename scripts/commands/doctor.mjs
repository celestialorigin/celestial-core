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

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.log(`⚠️ ${msg}`);
}

function fail(msg) {
  console.log(`❌ ${msg}`);
}

export async function runDoctor() {
  const root = process.cwd();

  console.log("🧪 CELESTIAL DOCTOR");

  // 1) git repo
  if (!exists(path.join(root, ".git"))) {
    fail("Not a git repository here (.git not found).");
    process.exitCode = 1;
    return;
  }
  ok("git repository detected");

  // 2) branch
  const branch = sh("git rev-parse --abbrev-ref HEAD");
  ok(`branch: ${branch}`);

  // 3) remote origin
  let origin = "";
  try {
    origin = sh("git remote get-url origin");
    ok(`origin: ${origin}`);
  } catch {
    fail("origin remote not found");
    process.exitCode = 1;
    return;
  }

  // 4) required paths
  const required = [
    "scripts/celestial.mjs",
    "scripts/commands/new.mjs",
    "scripts/commands/status.mjs",
    "scripts/commands/push.mjs",
    "scripts/commands/export.mjs",
    "src/content/dialogues",
    "src/content/activities",
  ];

  let missing = 0;
  for (const p of required) {
    const abs = path.join(root, p);
    if (exists(abs)) ok(`exists: ${p}`);
    else {
      fail(`missing: ${p}`);
      missing++;
    }
  }

  // 5) exports folder (optional)
  if (exists(path.join(root, "exports"))) ok("exports/ present");
  else warn("exports/ not found (run: npm run cel -- export)");

  // 6) working tree cleanliness (warn only)
  const dirty = sh("git status --porcelain");
  if (dirty) warn("working tree DIRTY (commit or stash recommended)");
  else ok("working tree CLEAN");

  // 7) ahead/behind (warn)
  try {
    sh("git fetch --quiet");
    const ab = sh("git rev-list --left-right --count origin/main...HEAD");
    const [behind, ahead] = ab.split(/\s+/);
    if (ahead !== "0" || behind !== "0") {
      warn(`sync: ahead ${ahead}, behind ${behind}`);
    } else {
      ok("sync: ahead 0, behind 0");
    }
  } catch {
    warn("could not compute ahead/behind");
  }

  // 8) result
  if (missing > 0) {
    console.log("");
    fail(`doctor found ${missing} missing required path(s).`);
    process.exitCode = 1;
    return;
  }

  console.log("");
  ok("doctor check passed");
}
