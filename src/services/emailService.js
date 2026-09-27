import nodemailer from 'nodemailer';

// ─── Build transporter once at module load ─────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email. Silently skips if SMTP creds are missing
 * (useful for dev/testing so nothing crashes).
 */
export const sendEmail = async ({ to, subject, html }) => {
  // Skip if creds missing
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Skipped — no SMTP creds] to=${to}, subject="${subject}"`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'MarketLink <noreply@marketlink.com>',
      to,
      subject,
      html,
    });
    console.log(`[Email sent] to=${to}, subject="${subject}"`);
  } catch (e) {
    console.error(`[Email failed] to=${to}:`, e.message);
    // Don't throw — email failures should never break API responses
  }
};