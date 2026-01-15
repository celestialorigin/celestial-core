import fs from "node:fs";
import path from "node:path";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function itemId(x) {
  // stable id for dedupe
  return `${x.type}:${x.slug}`;
}

function isPublic(x) {
  return (x.visibility || "public") === "public";
}

function parseTime(s) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

export async function runPublish() {
  const root = process.cwd();
  const exportsDir = path.join(root, "exports");
  ensureDir(exportsDir);

  const indexPath = path.join(exportsDir, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.log("❌ exports/index.json not found.");
    console.log('Run first: npm run cel -- export');
    process.exitCode = 1;
    return;
  }

  const statePath = path.join(exportsDir, "publish.state.json");
  const logPath = path.join(exportsDir, "publish.log.json");
  const planPath = path.join(exportsDir, "publish.plan.json");
  const xReadyPath = path.join(exportsDir, "x_queue.ready.json");

  const now = new Date();
  const nowMs = now.getTime();

  const all = readJson(indexPath);

  // load state (processed ids)
  let state = { processed: {}, lastRunAt: null };
  if (fs.existsSync(statePath)) {
    try {
      state = readJson(statePath);
      if (!state.processed) state.processed = {};
    } catch {
      // if broken, keep safe
      state = { processed: {}, lastRunAt: null };
    }
  }

  const processed = state.processed || {};

  // candidates: public & publishAt <= now
  const candidates = all
    .filter(isPublic)
    .filter((x) => x.publishAt && parseTime(x.publishAt) !== null)
    .filter((x) => parseTime(x.publishAt) <= nowMs);

  // todo: not processed yet
  const todo = candidates.filter((x) => !processed[itemId(x)]);

  // plan: for humans + future automations
  const plan = {
    generatedAt: nowIso(),
    now: nowIso(),
    counts: {
      totalIndex: Array.isArray(all) ? all.length : 0,
      candidates: candidates.length,
      todo: todo.length,
    },
    todo: todo.map((x) => ({
      id: itemId(x),
      type: x.type,
      source: x.source,
      title: x.title,
      slug: x.slug,
      publishAt: x.publishAt,
      path: x.path,
      // future hooks:
      actions: ["site", "x"], // placeholder: can be expanded later
    })),
  };

  // x_ready: simplest possible queue item
  const xReady = {
    generatedAt: nowIso(),
    items: todo.map((x) => ({
      id: itemId(x),
      kind: "post",
      source: x.source,
      title: x.title,
      slug: x.slug,
      publishAt: x.publishAt,
      message: `【${x.type}】${x.title}`,
      ref: x.path,
    })),
  };

  // update state: mark as processed (but we keep it safe: "plannedAt" only)
  // NOTE: v0.1 marks planned as processed. If you prefer "only mark after actual post",
  // we can switch later. For now, it prevents repeated spam.
  for (const x of todo) {
    processed[itemId(x)] = { plannedAt: nowIso(), publishAt: x.publishAt };
  }

  const newState = {
    lastRunAt: nowIso(),
    processed,
  };

  // append log
  const logEntry = {
    at: nowIso(),
    counts: plan.counts,
    marked: todo.map((x) => itemId(x)),
  };

  let log = { runs: [] };
  if (fs.existsSync(logPath)) {
    try {
      log = readJson(logPath);
      if (!Array.isArray(log.runs)) log.runs = [];
    } catch {
      log = { runs: [] };
    }
  }
  log.runs.push(logEntry);

  // write outputs
  writeJson(planPath, plan);
  writeJson(xReadyPath, xReady);
  writeJson(statePath, newState);
  writeJson(logPath, log);

  console.log("📣 publish (plan) done:");
  console.log(`- exports/publish.plan.json (todo: ${plan.counts.todo})`);
  console.log(`- exports/x_queue.ready.json (items: ${xReady.items.length})`);
  console.log(`- exports/publish.state.json`);
  console.log(`- exports/publish.log.json`);
}
