// scripts/notify/build-os.mjs
export async function buildOS() {
  const commandRoom = process.env.CELESTIAL_COMMAND_ROOM_URL || "";
  const now = new Date().toISOString();

  return {
    title: "CELESTIAL OS // STATUS",
    subject: "[CELESTIAL:OS] CELESTIAL OS Status",
    text: `CELESTIAL OS status generated.\nTime: ${now}\nCommand Room: ${commandRoom}`.trim(),
  };
}
