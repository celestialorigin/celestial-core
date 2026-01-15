import { execSync } from "node:child_process";

function safeExec(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function safeExecTry(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

export async function runPush() {
  console.log("🔁 sync before push: git pull --rebase --autostash");
  const ok = safeExecTry("git pull --rebase --autostash");
  if (!ok) {
    console.log("");
    console.log("⚠️ rebase failed. You may have conflicts.");
    console.log("Resolve conflicts, then run:");
    console.log("  git add .");
    console.log("  git rebase --continue");
    console.log("  git push");
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("🚀 pushing...");
  safeExec("git push");
  console.log("✅ push done.");
}
