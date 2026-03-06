'use strict';

const path    = require('path');
const express = require('express');
const mailer  = require('nodemailer');

require('dotenv').config();

/* ── Env helpers ───────────────────────────────────────────────────── */
const PORT      = Number(process.env.PORT) || 3000;
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SEC  = process.env.SMTP_SECURE !== 'false';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;

/* ── SMTP transport ────────────────────────────────────────────────── */
let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = mailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: SMTP_SEC,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });

  transporter.verify()
    .then(function () { console.log('✅ SMTP connected:', SMTP_HOST); })
    .catch(function (err) { console.error('❌ SMTP verify failed:', err.message); });
} else {
  console.warn('⚠️  SMTP not configured — emails will be logged to console');
}

/* ── Express app ───────────────────────────────────────────────────── */
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* Serve the static website from the repo root */
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
}));

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Simple email-format check */
function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Send an email — falls back to console.log when SMTP is not configured */
async function sendMail(to, subject, html) {
  const msg = { from: MAIL_FROM, to: to, subject: subject, html: html };

  if (transporter) {
    const info = await transporter.sendMail(msg);
    console.log('📧 Mail sent:', info.messageId);
    return info;
  }

  /* Fallback: log to console so development works without SMTP */
  console.log('📧 [dev] Would send email:\n', JSON.stringify(msg, null, 2));
  return { messageId: 'dev-' + Date.now() };
}

/* ── Registration confirmation template ────────────────────────────── */
function confirmationHtml(name) {
  return [
    '<!DOCTYPE html>',
    '<html lang="ru"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">',
    '<div style="background:#1a2744;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">',
    '  <h1 style="margin:0;font-size:1.4rem;">🌟 Pacific Star</h1>',
    '  <p style="margin:4px 0 0;opacity:.8;font-size:.9rem;">Транспортно-логистическая компания</p>',
    '</div>',
    '<div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">',
    '  <h2 style="margin:0 0 12px;font-size:1.2rem;">Добро пожаловать, ' + name + '!</h2>',
    '  <p style="color:#555;line-height:1.6;">',
    '    Ваша регистрация в личном кабинете Pacific Star прошла успешно.',
    '    Теперь вы можете отслеживать грузы, управлять заявками и получать уведомления о статусе доставки.',
    '  </p>',
    '  <p style="color:#555;line-height:1.6;">',
    '    Если вы не регистрировались на нашем сайте — просто проигнорируйте это письмо.',
    '  </p>',
    '  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">',
    '  <p style="color:#999;font-size:.82rem;text-align:center;">',
    '    © Pacific Star · pacificstar.ru',
    '  </p>',
    '</div>',
    '</body></html>',
  ].join('\n');
}

/* ── Contact form template ─────────────────────────────────────────── */
function contactHtml(data) {
  return [
    '<!DOCTYPE html>',
    '<html lang="ru"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">',
    '<h2 style="color:#1a2744;">Новая заявка с сайта pacificstar.ru</h2>',
    '<table style="border-collapse:collapse;width:100%;">',
    '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Имя</td><td style="padding:8px;border-bottom:1px solid #eee;">' + (data.name || '—') + '</td></tr>',
    '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">E-mail</td><td style="padding:8px;border-bottom:1px solid #eee;">' + (data.email || '—') + '</td></tr>',
    '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Телефон</td><td style="padding:8px;border-bottom:1px solid #eee;">' + (data.phone || '—') + '</td></tr>',
    '<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Услуга</td><td style="padding:8px;border-bottom:1px solid #eee;">' + (data.service || '—') + '</td></tr>',
    '<tr><td style="padding:8px;font-weight:bold;vertical-align:top;">Сообщение</td><td style="padding:8px;">' + (data.message || '—') + '</td></tr>',
    '</table>',
    '</body></html>',
  ].join('\n');
}

/* ── API routes ────────────────────────────────────────────────────── */

/**
 * POST /api/register
 * Body: { firstName, lastName, email, phone }
 *
 * Sends a registration confirmation email to the client.
 */
app.post('/api/register', async function (req, res) {
  try {
    var firstName = String(req.body.firstName || '').trim();
    var email     = String(req.body.email || '').trim();

    if (!firstName) {
      return res.status(400).json({ ok: false, error: 'Имя обязательно' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Некорректный e-mail' });
    }

    var lastName = String(req.body.lastName || '').trim();
    var fullName = (firstName + ' ' + lastName).trim();

    await sendMail(email, 'Регистрация на Pacific Star — подтверждение', confirmationHtml(fullName));

    return res.json({ ok: true, message: 'Письмо с подтверждением отправлено' });
  } catch (err) {
    console.error('Register email error:', err);
    return res.status(500).json({ ok: false, error: 'Не удалось отправить письмо' });
  }
});

/**
 * POST /api/contact
 * Body: { name, email, phone, service, message }
 *
 * Sends the contact form data to the company email.
 */
app.post('/api/contact', async function (req, res) {
  try {
    var email = String(req.body.email || '').trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Некорректный e-mail' });
    }

    await sendMail(
      SMTP_USER || 'info@pacificstar.ru',
      'Заявка с сайта от ' + (req.body.name || 'Посетитель'),
      contactHtml(req.body)
    );

    return res.json({ ok: true, message: 'Заявка отправлена' });
  } catch (err) {
    console.error('Contact email error:', err);
    return res.status(500).json({ ok: false, error: 'Не удалось отправить заявку' });
  }
});

/* ── Health check ──────────────────────────────────────────────────── */
app.get('/api/health', function (_req, res) {
  res.json({
    ok: true,
    smtp: !!transporter,
    time: new Date().toISOString(),
  });
});

/* ── Start ─────────────────────────────────────────────────────────── */
app.listen(PORT, function () {
  console.log('🚀 Pacific Star server running on http://localhost:' + PORT);
});
