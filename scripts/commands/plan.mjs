import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

function toLocalStr(isoLike) {
  // publish.plan は Date 文字列が入る想定。壊れてても落とさない。
  try {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return String(isoLike);
    // ローカル表示（JST環境ならJSTで出る）
    return d.toLocaleString();
  } catch {
    return String(isoLike);
  }
}

function pickTitle(item) {
  return item?.title || item?.slug || "(untitled)";
}

function pickKind(item) {
  // planの要素形が多少違っても読めるようにする
  return item?.type || item?.kind || item?.collection || "item";
}

function pickWhen(item) {
  // 予定の時刻キーも揺れに耐える
  return item?.publishAt || item?.when || item?.date || item?.at || "";
}

function pickPath(item) {
  return item?.path || item?.file || item?.slug || "";
}

export async function runPlan(opts = {}) {
  const root = process.cwd();
  const exportsDir = path.join(root, "exports");

  const planPath = path.join(exportsDir, "publish.plan.json");
  const xReadyPath = path.join(exportsDir, "x_queue.ready.json");

  const plan = readJson(planPath);
  const xReady = readJson(xReadyPath);

  if (!plan) {
    console.log("📣 CELESTIAL PLAN");
    console.log(`- missing: ${path.relative(root, planPath)}`);
    console.log("Tip: run `npm run cel -- publish` first.");
    return;
  }

  // publish.plan.json の形に揺れがあっても動くように吸収
  const todo = Array.isArray(plan?.todo)
    ? plan.todo
    : Array.isArray(plan)
      ? plan
      : Array.isArray(plan?.items)
        ? plan.items
        : [];

  const todoCount = todo.length;
  const xCount = Array.isArray(xReady?.items)
    ? xReady.items.length
    : Array.isArray(xReady)
      ? xReady.length
      : 0;

  console.log("📣 CELESTIAL PLAN");
  console.log(`- todo: ${todoCount}`);
  console.log(`- x_queue.ready: ${xCount}`);
  console.log(`- source: ${path.relative(root, planPath)}`);

  if (todoCount === 0) {
    console.log("\n✅ nothing to do");
    return;
  }

  // 時刻で並べ替え（壊れてても落ちない）
  const sorted = [...todo].sort((a, b) => {
    const da = new Date(pickWhen(a)).getTime();
    const db = new Date(pickWhen(b)).getTime();
    const na = Number.isNaN(da) ? 0 : da;
    const nb = Number.isNaN(db) ? 0 : db;
    return na - nb;
  });

  console.log("\n🗓️  todo items:");
  for (const item of sorted) {
    const kind = pickKind(item);
    const when = pickWhen(item);
    const title = pickTitle(item);
    const p = pickPath(item);

    const whenStr = when ? toLocalStr(when) : "(no time)";
    const pathStr = p ? ` — ${p}` : "";
    console.log(`- [${kind}] ${whenStr} :: ${title}${pathStr}`);
  }
}
