#!/usr/bin/env node
/** Fix data-i18n -> data-i18n-html where element contains <br> */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const ROOT = path.resolve(import.meta.dirname, '..');
const ru = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales/ru.json'), 'utf8'));

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let fixed = 0;

files.forEach((file) => {
  const fp = path.join(ROOT, file);
  let html = fs.readFileSync(fp, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false }, false);

  $('[data-i18n]').each((_, el) => {
    const inner = $(el).html() || '';
    if (!/<br\s*\/?>/i.test(inner)) return;
    const key = $(el).attr('data-i18n');
    $(el).attr('data-i18n-html', key);
    $(el).removeAttr('data-i18n');
    ru[key] = inner.replace(/\s+/g, ' ').trim();
    fixed++;
  });

  fs.writeFileSync(fp, $.html(), 'utf8');
});

fs.writeFileSync(
  path.join(ROOT, 'locales/ru.json'),
  JSON.stringify(Object.keys(ru).sort().reduce((a, k) => { a[k] = ru[k]; return a; }, {}), null, 2) + '\n'
);
console.log('Fixed br elements:', fixed);
