// scripts/adapters/mail-resend.mjs
export async function sendMailResend(payload) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CELESTIAL_MAIL_TO;
  const from = process.env.CELESTIAL_MAIL_FROM;

  if (!key) throw new Error("Missing RESEND_API_KEY");
  if (!to) throw new Error("Missing CELESTIAL_MAIL_TO");
  if (!from) throw new Error("Missing CELESTIAL_MAIL_FROM");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: payload.subject,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Resend failed: ${res.status} ${t}`);
  }
}
