import fs from "node:fs";
import path from "node:path";

function readJson(rel) {
  const p = path.join(process.cwd(), "exports", rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function toLocal(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");

    return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
  } catch {
    return String(iso);
  }
}


function ymdLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function runNotifyDiscord(rest = []) {
  const mode = rest?.includes("--dry") ? "dry" : "send";

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error("Missing env: DISCORD_WEBHOOK_URL");
    console.error("Tip: set it in GitHub Secrets, or in your shell env for local test.");
    process.exitCode = 1;
    return;
  }

  const schedule = readJson("schedule.json");
  const plan = readJson("publish.plan.json");
  const xReady = readJson("x_queue.ready.json");

  const scheduleArr = Array.isArray(schedule) ? schedule : [];

  const rawTodoItems = Array.isArray(plan?.todo)
    ? plan.todo
    : Array.isArray(plan)
      ? plan
      : Array.isArray(plan?.items)
        ? plan.items
        : [];

  const nowMs = Date.now();

  const todoItems = rawTodoItems.filter((it) => {
    const t =
      new Date(it?.publishAt ?? it?.when ?? it?.at ?? "").getTime();
    return Number.isNaN(t) ? true : t >= nowMs;
  });

  const todoCount = Math.max(0, Number(todoItems.length) || 0);



  const xReadyCount = Array.isArray(xReady?.items)
    ? xReady.items.length
    : Array.isArray(xReady)
      ? xReady.length
      : 0;

  const now = new Date();
  const todayKey = ymdLocal(now);

  const todayItems = scheduleArr
    .map((x) => ({ ...x, _t: new Date(x?.publishAt).getTime() }))
    .filter((x) => !Number.isNaN(x._t))
    .filter((x) => ymdLocal(new Date(x._t)) === todayKey)
    .sort((a, b) => a._t - b._t);

  const nextItems = scheduleArr
    .filter((x) => {
      const t = new Date(x?.publishAt).getTime();
      return !Number.isNaN(t) && t >= now.getTime();
    })
    .sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime());

  const nextOne = nextItems[0] ?? null;

  // Command Room URL (GitHub Pages想定：repo名=celestial-project)
  // もし将来URLが変わるなら env で上書きできるようにしてる
  const commandRoomUrl =
    process.env.CELESTIAL_COMMAND_ROOM_URL ||
    "https://celestialorigin.github.io/celestial-project/today/";

  const contentLines = [
    "🧭 **CELESTIAL OS // STATUS**",
    `📅 Today(${todayKey}): **${todayItems.length}**`,
    nextOne
      ? `⏭️ Next: **${nextOne.title ?? "(untitled)"}** (${toLocal(nextOne.publishAt)})`
      : `⏭️ Next: **none**`,
    `🧩 Plan todo: **${todoCount}**`,
    `🐦 X queue ready: **${xReadyCount}**`,
    `🔗 Command Room: ${commandRoomUrl}`,
  ];

  const payload = {
    content: contentLines.join("\n"),
    allowed_mentions: { parse: [] },
  };

  if (mode === "dry") {
    console.log("🧪 notify-discord --dry");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}\n${text}`);
  }

  console.log("✅ discord notified");
}
