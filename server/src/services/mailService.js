import nodemailer from 'nodemailer';

// SMTP is optional. When not configured, emails are logged to the console so
// every flow (verification, password reset) stays testable in development.
let transporter = null;

const configured = process.env.SMTP_HOST && process.env.SMTP_USER;

if (configured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`\n[DEV MAIL] to=${to} subject="${subject}"\n${html}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

export const isMailConfigured = () => configured;