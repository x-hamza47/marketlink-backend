import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export const sendEmail = async ({ to, subject, html }) => {
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

  }
};