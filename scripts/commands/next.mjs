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

export async function runNext() {
  const schedulePath = path.join(process.cwd(), "exports", "schedule.json");
  const schedule = readJson(schedulePath);

  console.log("🧭 CELESTIAL NEXT");

  if (!Array.isArray(schedule)) {
    console.log(`- missing/invalid: ${path.relative(process.cwd(), schedulePath)}`);
    console.log("Tip: run `npm run cel -- export` first.");
    return;
  }

  const now = Date.now();
  const upcoming = schedule
    .filter((x) => {
      const t = new Date(x?.publishAt).getTime();
      return !Number.isNaN(t) && t >= now;
    })
    .sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime());

  if (upcoming.length === 0) {
    console.log("✅ no upcoming scheduled items");
    return;
  }

  const n = upcoming[0];
  console.log(`- when: ${toLocal(n.publishAt)}`);
  console.log(`- type: ${n.type || "item"}`);
  console.log(`- title: ${n.title || "(untitled)"}`);
  if (n.path) console.log(`- path: ${n.path}`);
}
