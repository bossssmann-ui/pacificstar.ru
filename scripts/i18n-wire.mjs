#!/usr/bin/env node
/**
 * Wire unwired Cyrillic text in HTML with data-i18n / data-i18n-html.
 * Sync Russian strings to ru.json; flag keys needing EN/ZH translation.
 *
 * Usage: node scripts/i18n-wire.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import * as cheerio from 'cheerio';

const ROOT = path.resolve(import.meta.dirname, '..');
const DRY = process.argv.includes('--dry-run');

const SKIP_FILES = new Set([
  'offline.html', 'START.html', 'hello.html', 'logos.html',
  'DEPLOY_GUIDE.html', 'test.html'
]);

const INLINE_OK = new Set(['br', 'strong', 'em', 'b', 'i', 'a', 'span', 'small', 'sup', 'sub']);

const TAGS = ['h1', 'h2', 'h3', 'h4', 'p', 'li', 'label', 'td', 'th', 'dt', 'dd', 'figcaption', 'button', 'a', 'span'];

function pagePrefix(file) {
  const base = file.replace('.html', '');
  return base === 'index' ? 'index' : base.replace(/-/g, '_');
}

function hasCyrillic(s) {
  return /[\u0400-\u04FF]/.test(s);
}

function slugPart(s) {
  return s.toLowerCase()
    .replace(/&nbsp;/g, ' ')
    .replace(/[^a-z0-9а-яё]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
}

function makeKey(prefix, tag, cls, content) {
  const hash = createHash('md5').update(content).digest('hex').slice(0, 6);
  const clsPart = slugPart(cls || tag);
  return `${prefix}.${tag}.${clsPart}_${hash}`;
}

function getClasses(el, $) {
  const c = $(el).attr('class');
  return c ? c.split(/\s+/)[0] : '';
}

function innerHasBlockChildren(el, $) {
  const children = $(el).children().toArray();
  return children.some((ch) => {
    const tag = ch.tagName && ch.tagName.toLowerCase();
    return tag && !INLINE_OK.has(tag);
  });
}

function normalizeHtml(html) {
  return html.replace(/\s+/g, ' ').trim();
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function shouldSkipText(text) {
  if (!text || text.length < 2) return true;
  if (!hasCyrillic(text)) return true;
  if (/^\+?[\d\s()\-–—]+$/.test(text)) return true;
  if (/^https?:\/\//.test(text)) return true;
  return false;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', file), 'utf8'));
}

function saveJson(file, obj) {
  const sorted = Object.keys(obj).sort().reduce((acc, k) => {
    acc[k] = obj[k];
    return acc;
  }, {});
  fs.writeFileSync(
    path.join(ROOT, 'locales', file),
    JSON.stringify(sorted, null, 2) + '\n',
    'utf8'
  );
}

const ru = loadJson('ru.json');
const en = loadJson('en.json');
const zh = loadJson('zh.json');
const newKeys = [];

function wireFile(file) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false }, false);
  const prefix = pagePrefix(file);
  let wired = 0;

  $(TAGS.join(',')).each((_, el) => {
    if ($(el).closest('svg, script, style, noscript').length) return;
    if ($(el).attr('data-i18n') || $(el).attr('data-i18n-html')) return;
    if ($(el).find('[data-i18n],[data-i18n-html]').length) return;

    const tag = el.tagName.toLowerCase();
    const useHtml = innerHasBlockChildren(el, $) || (tag === 'h1' && $(el).find('span').length);
    const content = useHtml ? $.html(el).replace(/^<[^>]+>|<\/[^>]+>$/g, '') : $(el).text();
    const plain = normalizeText($(el).text());

    if (shouldSkipText(plain)) return;

    const cls = getClasses(el, $);
    const key = makeKey(prefix, tag, cls, useHtml ? normalizeHtml(content) : plain);

    if (useHtml) {
      $(el).attr('data-i18n-html', key);
    } else {
      $(el).attr('data-i18n', key);
    }

    const ruVal = useHtml ? normalizeHtml($(el).html()) : plain;
    if (!ru[key]) {
      ru[key] = ruVal;
      newKeys.push({ key, ru: ruVal, file });
    }

  wired++;
  });

  if (!DRY && wired > 0) {
    html = $.html();
    fs.writeFileSync(filePath, html, 'utf8');
  }
  return wired;
}

const htmlFiles = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && !SKIP_FILES.has(f));

let total = 0;
htmlFiles.forEach((f) => {
  const n = wireFile(f);
  if (n) console.log(`${f}: wired ${n}`);
  total += n;
});

console.log(`Total wired: ${total}, new ru keys: ${newKeys.length}`);

if (!DRY) {
  saveJson('ru.json', ru);
  fs.writeFileSync(
    path.join(ROOT, 'scripts', 'i18n-new-keys.json'),
    JSON.stringify(newKeys, null, 2),
    'utf8'
  );
}
