import { spawnNodeScript } from "../core/exec.mjs";

const TARGET_TO_SCRIPT = {
  dialogue: "./scripts/new-dialogue.mjs",
  activity: "./scripts/new-activity.mjs",
};

export async function runNew(target, args) {
  const script = TARGET_TO_SCRIPT[target];
  if (!script) {
    throw new Error(`Unknown new target: ${target} (expected dialogue|activity)`);
  }

  // 既存CLIをそのまま呼ぶ（互換維持）
  // argsは例: ['--', '"Title"', '--publish', ...] ではなく、
  // npm run cel -- new dialogue -- "Title" ... で渡ってくる配列をそのまま転送
  await spawnNodeScript(script, args);
}
