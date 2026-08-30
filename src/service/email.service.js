import config from '../config/config.js';

export async function sendEmail(to, subject, text, html) {
  const apiKey = process.env.BREVO_API_KEY || config.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || config.EMAIL_FROM || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || "Moodify";

  if (!apiKey) {
    console.error("❌ BREVO_API_KEY missing in environment variables");
    return { ok: false, error: "Missing BREVO_API_KEY" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html || `<p>${text}</p>`,
        textContent: text,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("❌ Brevo API Error:", data);
      return { ok: false, error: data.message || "Brevo send failed" };
    }

    console.log(`✉️ OTP email successfully delivered to ${to}`);
    return { ok: true, data };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { ok: false, error: error.message };
  }
}
