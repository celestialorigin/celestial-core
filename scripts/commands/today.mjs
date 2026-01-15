import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function toLocal(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function ymdLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function runToday() {
  const schedulePath = path.join(process.cwd(), "exports", "schedule.json");
  const schedule = readJson(schedulePath);

  console.log("📅 CELESTIAL TODAY");

  if (!Array.isArray(schedule)) {
    console.log(`- missing/invalid: ${path.relative(process.cwd(), schedulePath)}`);
    console.log("Tip: run `npm run cel -- export` first.");
    return;
  }

  const todayKey = ymdLocal(new Date());

  const todays = schedule
    .map((x) => ({ ...x, _t: new Date(x?.publishAt).getTime() }))
    .filter((x) => !Number.isNaN(x._t))
    .filter((x) => ymdLocal(new Date(x._t)) === todayKey)
    .sort((a, b) => a._t - b._t);

  console.log(`- date: ${todayKey}`);
  console.log(`- items: ${todays.length}`);

  if (todays.length === 0) {
    console.log("✅ nothing scheduled today");
    return;
  }

  console.log("\n🗓️  items:");
  for (const it of todays) {
    console.log(`- [${it.type || "item"}] ${toLocal(it.publishAt)} :: ${it.title || "(untitled)"}`);
    if (it.path) console.log(`  path: ${it.path}`);
  }
}
