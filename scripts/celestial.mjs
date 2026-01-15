#!/usr/bin/env node

import { runNotify } from "./commands/notify.mjs";
import { runNew } from "./commands/new.mjs";
import { runStatus } from "./commands/status.mjs";
import { runPush } from "./commands/push.mjs";
import { runExport } from "./commands/export.mjs";
import { runDoctor } from "./commands/doctor.mjs";
import { runPublish } from "./commands/publish.mjs";
import { runPlan } from "./commands/plan.mjs";
import { runNext } from "./commands/next.mjs";
import { runToday } from "./commands/today.mjs";
import { runNotifyDiscord } from "./commands/notify-discord.mjs";

function help() {
  console.log(`
CELESTIAL CLI (cel)

Usage:
  cel new dialogue -- "Title" [options...]
  cel new activity -- "Title" [options...]
  cel status
  cel push
  cel export
  cel doctor
  cel publish
  cel plan
  cel next
  cel today

  # legacy
  cel notify discord [--dry]

  # new (extensible)
  cel notify os [--to discord|mail|both] [--dry]
  cel notify plan [--to discord|mail|both] [--dry]
  cel notify publish [--to discord|mail|both] [--dry]
  cel notify alert [--to discord|mail|both] [--dry]
  cel notify digest [--to discord|mail|both] [--dry]

Examples:
  npm run cel -- new dialogue -- "Hello" --publish "2026-02-01 21:00" --git --push
  npm run cel -- new activity -- "Stream #01" --source twitch --publish "2026-02-02 20:00" --git --push
  npm run cel -- status
  npm run cel -- export
  npm run cel -- publish
  npm run cel -- notify os --to discord
  npm run cel -- notify os --to mail
  npm run cel -- notify os --to both

`);
}

async function main() {
  const argv = process.argv.slice(2);
  const [cmd, subcmd, ...rest] = argv;

  if (!cmd || cmd === "-h" || cmd === "--help") {
    help();
    process.exit(0);
  }

  if (cmd === "new") {
    if (!subcmd) {
      console.error("Missing target: dialogue|activity");
      help();
      process.exit(1);
    }
    await runNew(subcmd, rest);
    return;
  }

  if (cmd === "status") {
    await runStatus();
    return;
  }

  if (cmd === "push") {
    await runPush();
    return;
  }

  if (cmd === "export") {
    await runExport();
    return;
  }

  if (cmd === "doctor") {
    await runDoctor();
    return;
  }

  if (cmd === "publish") {
    await runPublish();
    return;
  }

  if (cmd === "plan") {
    await runPlan();
    return;
  }

  if (cmd === "next") {
    await runNext();
    return;
  }

  if (cmd === "today") {
    await runToday();
    return;
  }

  if (cmd === "notify") {
    // legacy: `notify discord`
    if (subcmd === "discord") {
      await runNotifyDiscord(rest);
      return;
    }

    // new: `notify os|plan|publish|alert|digest`
    if (!subcmd) {
      console.error("Missing kind: os|plan|publish|alert|digest");
      help();
      process.exit(1);
    }

    await runNotify(subcmd, rest);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  help();
  process.exit(1);
}

main().catch((e) => {
  console.error("[cel] fatal:", e?.stack || e);
  process.exit(1);
});
