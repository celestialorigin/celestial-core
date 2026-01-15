import fs from "node:fs";
import path from "node:path";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f));
}

// --- frontmatter parser (minimal, enough for our schema) ---
function parseFrontmatter(md) {
  // expects:
  // ---
  // key: value
  // ---
  if (!md.startsWith("---")) return { data: {}, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: md };

  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).replace(/^\s*\n/, "");

  const data = {};
  // ultra-simple YAML-ish parser: key: "value" / key: value
  // NOTE: tagsV1 etc may be nested; we keep raw for now.
  const lines = raw.split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2].trim();
    // strip quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    data[k] = v;
  }

  return { data, body };
}

function safeIso(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normVisibility(v) {
  if (!v) return "public";
  const vv = String(v).toLowerCase();
  if (["public", "unlisted", "draft"].includes(vv)) return vv;
  return "public";
}

function buildItem({ type, filepath, fm, body }) {
  const rel = filepath.replaceAll("\\", "/");
  const slug = path.basename(filepath, ".md").replace(/^\d{4}-\d{2}-\d{2}_/, "");
  const title = fm.title || slug;

  const publishAt = safeIso(fm.publishAt);
  const createdAt = safeIso(fm.createdAt);

  // naive excerpt: first non-empty line after heading
  const lines = body.split("\n").map((s) => s.trim());
  const excerpt =
    lines.find((s) => s && !s.startsWith("#") && s !== "（ここに本文）") || "";

  return {
    type,
    source: fm.source || "internal",
    title,
    slug,
    description: fm.description || "",
    visibility: normVisibility(fm.visibility),
    publishAt: publishAt ? publishAt.toISOString() : null,
    createdAt: createdAt ? createdAt.toISOString() : null,
    path: rel,
    excerpt,
  };
}

function byPublishDesc(a, b) {
  const ap = a.publishAt ? Date.parse(a.publishAt) : 0;
  const bp = b.publishAt ? Date.parse(b.publishAt) : 0;
  return bp - ap;
}

export async function runExport() {
  const root = process.cwd();
  const outDir = path.join(root, "exports");
  ensureDir(outDir);

  const now = new Date();

  const dialoguesDir = path.join(root, "src", "content", "dialogues");
  const activitiesDir = path.join(root, "src", "content", "activities");

  const dialogues = listMd(dialoguesDir).map((p) => {
    const md = readText(p);
    const { data, body } = parseFrontmatter(md);
    return buildItem({ type: "dialogue", filepath: p, fm: data, body });
  });

  const activities = listMd(activitiesDir).map((p) => {
    const md = readText(p);
    const { data, body } = parseFrontmatter(md);
    return buildItem({ type: "activity", filepath: p, fm: data, body });
  });

  // unified index
  const all = [...dialogues, ...activities].sort(byPublishDesc);

  // schedule (future publishAt)
  const schedule = all
    .filter((x) => x.publishAt && Date.parse(x.publishAt) > now.getTime())
    .sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt));

  // x_queue (future: filter public & publishAt <= now, but for now export empty placeholder rules)
  const x_queue = all
    .filter((x) => x.visibility === "public")
    .filter((x) => x.publishAt && Date.parse(x.publishAt) <= now.getTime())
    .slice(0, 50)
    .map((x) => ({
      kind: "post",
      source: x.source,
      title: x.title,
      slug: x.slug,
      publishAt: x.publishAt,
      // future: message/template fields
      message: `【${x.type}】${x.title}`,
      ref: x.path,
    }));

  // write outputs
  writeJson(path.join(outDir, "dialogues.json"), dialogues.sort(byPublishDesc));
  writeJson(path.join(outDir, "activities.json"), activities.sort(byPublishDesc));
  writeJson(path.join(outDir, "index.json"), all);
  writeJson(path.join(outDir, "schedule.json"), schedule);
  writeJson(path.join(outDir, "x_queue.json"), x_queue);

  writeJson(path.join(outDir, "export.meta.json"), {
    generatedAt: now.toISOString(),
    counts: {
      dialogues: dialogues.length,
      activities: activities.length,
      all: all.length,
      schedule: schedule.length,
      x_queue: x_queue.length,
    },
  });

  console.log("📦 export done:");
  console.log(`- ${path.relative(root, outDir)}/index.json`);
  console.log(`- ${path.relative(root, outDir)}/dialogues.json`);
  console.log(`- ${path.relative(root, outDir)}/activities.json`);
  console.log(`- ${path.relative(root, outDir)}/schedule.json`);
  console.log(`- ${path.relative(root, outDir)}/x_queue.json`);
  console.log(`- ${path.relative(root, outDir)}/export.meta.json`);
}
