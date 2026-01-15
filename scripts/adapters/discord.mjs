// scripts/adapters/discord.mjs
export async function sendDiscord(payload) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error("Missing DISCORD_WEBHOOK_URL");

  const body = { content: payload.text };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Discord webhook failed: ${res.status} ${t}`);
  }
}
