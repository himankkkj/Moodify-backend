import nodemailer from 'nodemailer';
import config from '../config/config.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || config.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS || config.EMAIL_APP_PASS,
  },
});

export async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Moodify" <${process.env.EMAIL_USER || config.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });

    console.log(`✉️ OTP Email successfully delivered to ${to} (Message ID: ${info.messageId})`);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);

    // In development mode, log fallback so you are never blocked testing locally
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 [DEV FALLBACK OTP] Message for ${to}: ${text}`);
    }

    return { ok: false, error: error.message };
  }
}
