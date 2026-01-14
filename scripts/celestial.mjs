#!/usr/bin/env node
import { runNew } from "./commands/new.mjs";

function help() {
  console.log(`
CELESTIAL CLI (cel)

Usage:
  cel new dialogue -- "Title" [options...]
  cel new activity -- "Title" [options...]

Examples:
  npm run cel -- new dialogue -- "Hello" --publish "2026-02-01 21:00" --git --push
  npm run cel -- new activity -- "Stream #01" --source twitch --publish "2026-02-02 20:00" --git --push
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

  console.error(`Unknown command: ${cmd}`);
  help();
  process.exit(1);
}

main().catch((e) => {
  console.error("[cel] fatal:", e?.stack || e);
  process.exit(1);
});
