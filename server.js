'use strict';

const fs            = require('fs');
const path            = require('path');
const express     = require('express');
const mailer      = require('nodemailer');
const compression = require('compression');
const dotenv      = require('dotenv');

var loadedEnvPath = null;
var envPaths = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env'),
  '/app/.env',
];
for (var i = 0; i < envPaths.length; i++) {
  if (fs.existsSync(envPaths[i])) {
    dotenv.config({ path: envPaths[i], quiet: true });
    loadedEnvPath = envPaths[i];
    break;
  }
}
if (!loadedEnvPath) {
  dotenv.config({ quiet: true });
}

/* ── Env helpers ───────────────────────────────────────────────────── */
const REQUIRED_ENV_KEYS = [
  'API_ONLY',
  'CONTACT_EMAIL',
  'CORS_ORIGIN',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
];

function envPresence(key) {
  var value = process.env[key];
  return typeof value === 'string' && value.length > 0;
}

function missingEnvKeys() {
  return REQUIRED_ENV_KEYS.filter(function (key) {
    return !envPresence(key);
  });
}
// Timeweb App Platform uses dynamic PORT; if it's not set for some reason,
// default to 8080 (matches Dockerfile EXPOSE) to avoid proxy mismatches.
const PORT      = Number(process.env.PORT) || 8080;
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SEC  = process.env.SMTP_SECURE !== 'false';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;
const AMOCRM_WEBHOOK_URL = process.env.AMOCRM_WEBHOOK_URL || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://pacificstar.ru';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'sales@pacificstar.ru';
const API_ONLY    = process.env.API_ONLY === 'true' || process.env.API_ONLY === '1';

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
  console.warn(
    '   SMTP env: HOST=' + (SMTP_HOST ? 'set' : 'EMPTY') +
    ' USER=' + (SMTP_USER ? 'set' : 'EMPTY') +
    ' PASS=' + (SMTP_PASS ? 'set' : 'EMPTY')
  );
}

/* ── Express app ───────────────────────────────────────────────────── */
const app = express();

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* CORS for split static/API deploy (Phase 0 variant B) */
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

/* Cache-Control for versioned static assets (JS, CSS, images, fonts) */
app.use(function (req, res, next) {
  if (/\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)(\?.*)?$/.test(req.url)) {
    /* Versioned assets (query-string cache-buster) get a long TTL */
    if (/\?/.test(req.url)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.set('Cache-Control', 'public, max-age=86400');
    }
  }
  next();
});

/* Serve static only when needed (App Platform: API_ONLY=true, static on shared hosting) */
if (!API_ONLY) {
  app.use(express.static(path.join(__dirname), {
    extensions: ['html'],
    etag:         true,
    lastModified: true,
  }));
} else {
  console.log('API_ONLY mode — static files not served from this process');
}

/* ── Helpers ───────────────────────────────────────────────────────── */

/** Simple email-format check */
function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

/** Phone: at least 10 digits (RU/international) */
function isValidPhone(value) {
  return typeof value === 'string' && value.replace(/\D/g, '').length >= 10;
}

/** Normalize contact/hero payloads into a single shape for email + CRM */
function normalizeContactBody(raw) {
  var data = Object.assign({}, raw || {});
  var parts = [];

  if (data.route) parts.push('Маршрут: ' + data.route);
  if (data.cargo) parts.push('Груз: ' + data.cargo);
  if (data.source && !data.service) data.service = data.source;
  if (!data.message && parts.length) data.message = parts.join('\n');
  if (data.source && data.message) {
    data.message = 'Источник: ' + data.source + '\n' + data.message;
  } else if (data.source) {
    data.message = 'Источник: ' + data.source;
  }

  return data;
}

/** Forward lead data to AmoCRM webhook (no-op when URL is not configured) */
async function forwardToAmoCrm(payload) {
  if (!AMOCRM_WEBHOOK_URL) {
    return { skipped: true };
  }

  var res = await fetch(AMOCRM_WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('AmoCRM webhook HTTP ' + res.status);
  }

  return res.json().catch(function () { return { ok: true }; });
}

/** Build AmoCRM payload from contact / callback form data */
function amocrmLeadPayload(data, source) {
  return {
    source:  source || 'website',
    name:    data.name || data.firstName || 'Посетитель',
    email:   data.email || '',
    phone:   data.phone || '',
    service: data.service || '',
    message: data.message || '',
    time:    data.time || '',
    page:    data.page || '',
    sent_at: new Date().toISOString(),
  };
}

/** Escape HTML special characters to prevent XSS */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
var CONFIRMATION_TEMPLATE_PREFIX = [
  '<!DOCTYPE html>',
  '<html lang="ru"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">',
  '<div style="background:#1a2744;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">',
  '  <h1 style="margin:0;font-size:1.4rem;">🌟 Pacific Star</h1>',
  '  <p style="margin:4px 0 0;opacity:.8;font-size:.9rem;">Транспортно-логистическая компания</p>',
  '</div>',
  '<div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">',
  '  <h2 style="margin:0 0 12px;font-size:1.2rem;">Добро пожаловать, ',
].join('\n');

var CONFIRMATION_TEMPLATE_SUFFIX = [
  '!</h2>',
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

function confirmationHtml(name) {
  return CONFIRMATION_TEMPLATE_PREFIX + escapeHtml(name) + CONFIRMATION_TEMPLATE_SUFFIX;
}

/* ── Contact form template ─────────────────────────────────────────── */
var CONTACT_TEMPLATE_PREFIX = [
  '<!DOCTYPE html>',
  '<html lang="ru"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">',
  '<h2 style="color:#1a2744;">Новая заявка с сайта pacificstar.ru</h2>',
  '<table style="border-collapse:collapse;width:100%;">',
].join('\n');

var CONTACT_TEMPLATE_SUFFIX = '</table>\n</body></html>';

var TD_LABEL = 'style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;"';
var TD_VALUE = 'style="padding:8px;border-bottom:1px solid #eee;"';
var TD_LABEL_LAST = 'style="padding:8px;font-weight:bold;vertical-align:top;"';
var TD_VALUE_LAST = 'style="padding:8px;"';

function contactRow(label, value, isLast) {
  var tl = isLast ? TD_LABEL_LAST : TD_LABEL;
  var tv = isLast ? TD_VALUE_LAST : TD_VALUE;
  return '<tr><td ' + tl + '>' + label + '</td><td ' + tv + '>' + value + '</td></tr>';
}

function contactHtml(data) {
  var d = normalizeContactBody(data);
  return CONTACT_TEMPLATE_PREFIX + '\n' +
    contactRow('Имя',       escapeHtml(d.name    || '—'), false) + '\n' +
    contactRow('E-mail',    escapeHtml(d.email   || '—'), false) + '\n' +
    contactRow('Телефон',   escapeHtml(d.phone   || '—'), false) + '\n' +
    contactRow('Услуга',    escapeHtml(d.service || '—'), false) + '\n' +
    contactRow('Сообщение', escapeHtml(d.message || '—'), true)  + '\n' +
    CONTACT_TEMPLATE_SUFFIX;
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
    var phone = String(req.body.phone || '').trim();
    var hasEmail = isValidEmail(email);
    var hasPhone = isValidPhone(phone);

    if (!hasEmail && !hasPhone) {
      return res.status(400).json({ ok: false, error: 'Укажите e-mail или телефон' });
    }

    var payload = normalizeContactBody(req.body);

    await sendMail(
      CONTACT_EMAIL,
      'Заявка с сайта от ' + (payload.name || 'Посетитель'),
      contactHtml(payload)
    );

    try {
      await forwardToAmoCrm(amocrmLeadPayload(payload, payload.service || 'contact-form'));
    } catch (crmErr) {
      console.warn('AmoCRM forward failed (contact):', crmErr.message);
    }

    return res.json({ ok: true, message: 'Заявка отправлена' });
  } catch (err) {
    console.error('Contact email error:', err);
    return res.status(500).json({ ok: false, error: 'Не удалось отправить заявку' });
  }
});

/**
 * POST /api/callback
 * Body: { name, phone, time, page }
 *
 * Forwards callback widget requests to AmoCRM (when configured).
 */
app.post('/api/callback', async function (req, res) {
  try {
    var phone = String(req.body.phone || '').trim();
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Телефон обязателен' });
    }

    var payload = amocrmLeadPayload({
      name:    req.body.name || 'Обратный звонок',
      phone:   phone,
      time:    req.body.time || '',
      message: 'Запрос обратного звонка',
      page:    req.body.page || '',
    }, 'callback-widget');

    if (!AMOCRM_WEBHOOK_URL) {
      console.log('📞 [dev] Callback request:', JSON.stringify(payload, null, 2));
      return res.json({ ok: true, message: 'Заявка принята (AmoCRM не настроен)' });
    }

    await forwardToAmoCrm(payload);
    return res.json({ ok: true, message: 'Мы перезвоним в указанное время' });
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).json({ ok: false, error: 'Не удалось отправить заявку' });
  }
});

/* ── Health check ──────────────────────────────────────────────────── */
function healthPayload() {
  return {
    ok: true,
    smtp: !!transporter,
    amocrm: !!AMOCRM_WEBHOOK_URL,
    apiOnly: API_ONLY,
    env: {
      apiOnly: envPresence('API_ONLY'),
      contactEmail: envPresence('CONTACT_EMAIL'),
      corsOrigin: envPresence('CORS_ORIGIN'),
      smtpHost: envPresence('SMTP_HOST'),
      smtpUser: envPresence('SMTP_USER'),
      smtpPass: envPresence('SMTP_PASS'),
      mailFrom: envPresence('MAIL_FROM'),
    },
    time: new Date().toISOString(),
  };
}

app.get('/', function (_req, res) {
  res.json(healthPayload());
});

app.get('/api/health', function (_req, res) {
  res.json(healthPayload());
});

/* ── Start ─────────────────────────────────────────────────────────── */
process.on('uncaughtException', function (err) {
  console.error('uncaughtException:', err);
});
process.on('unhandledRejection', function (reason) {
  console.error('unhandledRejection:', reason);
});

console.log(
  'Pacific Star boot: PORT=' + PORT +
  ' NODE_ENV=' + (process.env.NODE_ENV || 'unset') +
  ' envFile=' + (loadedEnvPath || 'none') +
  ' envKeys=' + Object.keys(process.env).length +
  ' CONTACT_EMAIL=' + CONTACT_EMAIL +
  ' (env=' + (process.env.CONTACT_EMAIL ? 'set' : 'default') + ')' +
  ' SMTP_USER=' + (SMTP_USER || '(empty)') +
  ' MAIL_FROM=' + (MAIL_FROM || '(empty)') +
  ' API_ONLY=' + API_ONLY +
  ' (raw=' + (process.env.API_ONLY || 'unset') + ')'
);

var missing = missingEnvKeys();
if (missing.length) {
  console.warn(
    '⚠️  App Platform ENV missing (' + missing.length + '): ' + missing.join(', ')
  );
  console.warn(
    '   Timeweb: Настройки → Настройка деплоя → Редактировать → Переменные (по одной!)'
  );
  console.warn(
    '   Команда запуска: npm start  (не PM2 по умолчанию — иначе ENV не обновляется)'
  );
  console.warn(
    '   После сохранения ENV: вкладка Деплой → новый деплой (не только перезагрузка).'
  );
}

app.listen(PORT, '0.0.0.0', function () {
  console.log('🚀 Pacific Star server listening on 0.0.0.0:' + PORT);
});
