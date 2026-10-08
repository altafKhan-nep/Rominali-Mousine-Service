import { asyncHandler } from '../middleware/error.js';
import { sendMail } from '../services/mailService.js';
import { getSettings } from '../services/settingsService.js';

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact/quote — sends a free-quote request straight to the operator's inbox.
export const sendQuote = asyncHandler(async (req, res) => {
  const { name, email, phone, service, date, message } = req.body || {};

  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  const { supportEmail } = await getSettings();

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone],
    ['Service', service || '—'],
    ['Preferred date', date || '—'],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#1c2541;white-space:nowrap;">${esc(k)}</td>` +
        `<td style="padding:6px 0;color:#0b0d0f;">${esc(v)}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;border:1px solid #e6e6ea;border-radius:12px;overflow:hidden;">
      <div style="background:#0b132b;padding:18px 24px;">
        <h2 style="margin:0;color:#d4af37;font-size:18px;">New quote request</h2>
      </div>
      <div style="padding:20px 24px;">
        <table style="border-collapse:collapse;font-size:14px;width:100%;">${rows}</table>
        ${message ? `<p style="margin:16px 0 4px;font-weight:bold;color:#1c2541;font-size:14px;">Message</p><p style="margin:0;color:#0b0d0f;font-size:14px;white-space:pre-line;">${esc(message)}</p>` : ''}
      </div>
    </div>
  `;

  await sendMail({ to: supportEmail, subject: `New quote request${service ? ` — ${service}` : ''}`, html });

  res.json({ ok: true });
});