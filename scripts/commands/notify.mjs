// scripts/commands/notify.mjs
import { buildOS } from "../notify/build-os.mjs";
import { sendDiscord } from "../adapters/discord.mjs";
import { sendMailResend } from "../adapters/mail-resend.mjs";

function pickArg(args, name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  const v = args[i + 1];
  if (!v || v.startsWith("--")) return def;
  return v;
}

function hasFlag(args, name) {
  return args.includes(name);
}

export async function runNotify(kind, args) {
  const to = pickArg(args, "--to", "discord"); // discord|mail|both
  const dry = hasFlag(args, "--dry");

  let payload;

  if (kind === "os") {
    payload = await buildOS();
  } else if (kind === "alert") {
    // v1: とりあえず OS を流用して件名だけ変える（あとで専用化）
    payload = await buildOS();
    payload.subject = "[CELESTIAL:ALERT] CELESTIAL ALERT";
    payload.title = "CELESTIAL OS // ALERT";
  } else {
    throw new Error(`notify kind not implemented yet: ${kind}`);
  }

  if (dry) {
    console.log(JSON.stringify({ kind, to, payload }, null, 2));
    return;
  }

  if (to === "discord" || to === "both") {
    await sendDiscord(payload);
  }
  if (to === "mail" || to === "both") {
    await sendMailResend(payload);
  }

  console.log(`[cel] notify ${kind} -> ${to} done`);
}
