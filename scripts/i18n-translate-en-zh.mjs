#!/usr/bin/env node
/**
 * Fill missing EN/ZH keys from ru.json using MyMemory API (fallback).
 * Post-processes logistics glossary for quality.
 *
 * Usage: node scripts/i18n-translate-en-zh.mjs [--limit=50]
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const limit = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const GLOSSARY_EN = [
  [/контейнеровозы/gi, 'container trucks'],
  [/контейнеровоз/gi, 'container truck'],
  [/Container ships/gi, 'container trucks'],
  [/тралы/gi, 'lowbed trailers'],
  [/Северный завоз/gi, 'Northern supply delivery'],
  [/каботаж/gi, 'cabotage'],
  [/негабарит/gi, 'oversized cargo'],
  [/Дальн(ий|его) Восток/gi, 'Russian Far East'],
  [/ДФО/g, 'Russian Far East'],
  [/Арктик/gi, 'Arctic'],
  [/411-ФЗ/g, 'Federal Law No. 411-FZ'],
  [/ВЭД/g, 'foreign trade'],
  [/мультимодальн/gi, 'multimodal'],
  [/генгруз/gi, 'general cargo'],
  [/ж\/д/gi, 'rail'],
  [/РЖД/g, 'Russian Railways'],
  [/Приморск/gi, 'Primorye'],
];

const GLOSSARY_ZH = [
  [/контейнеровозы/gi, '集装箱卡车'],
  [/контейнеровоз/gi, '集装箱卡车'],
  [/集装箱船/g, '集装箱卡车'],
  [/тралы/gi, '低平板拖车'],
  [/Северный завоз/gi, '北方物资运输'],
  [/каботаж/gi, '沿海运输'],
  [/негабарит/gi, '超限货物'],
  [/Дальн(ий|его) Восток/gi, '远东'],
  [/ДФО/g, '远东'],
  [/Арктик/gi, '北极'],
  [/411-ФЗ/g, '411-FZ联邦法'],
  [/ВЭД/g, '外贸'],
  [/мультимодальн/gi, '多式联运'],
  [/генгруз/gi, '普通货物'],
  [/ж\/д/gi, '铁路'],
  [/РЖД/g, '俄罗斯铁路'],
];

function applyGlossary(text, rules) {
  let out = text;
  rules.forEach(([re, rep]) => { out = out.replace(re, rep); });
  return out;
}

function load(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', name), 'utf8'));
}

function save(name, obj) {
  const sorted = Object.keys(obj).sort().reduce((a, k) => { a[k] = obj[k]; return a; }, {});
  fs.writeFileSync(path.join(ROOT, 'locales', name), JSON.stringify(sorted, null, 2) + '\n');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateChunk(text, lang) {
  const pair = lang === 'zh' ? 'ru|zh-CN' : 'ru|en';
  const max = 480;
  if (text.length <= max) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}&de=bossssmann@gmail.com`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200) return data.responseData.translatedText;
    throw new Error(data.responseDetails || 'translate failed');
  }
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const out = [];
  for (const p of parts) {
    out.push(await translateChunk(p.trim(), lang));
    await sleep(350);
  }
  return out.join(' ');
}

const ru = load('ru.json');
const en = load('en.json');
const zh = load('zh.json');

const missing = Object.keys(ru).filter((k) => !en[k] || !zh[k]);
const todo = limit ? missing.slice(0, limit) : missing;

console.log(`Translating ${todo.length} of ${missing.length} missing keys...`);

let done = 0;
for (const key of todo) {
  const src = ru[key];
  if (!src || !/[\u0400-\u04FF]/.test(src)) continue;

  try {
    if (!en[key]) {
      let t = await translateChunk(src, 'en');
      t = applyGlossary(t, GLOSSARY_EN);
      en[key] = t;
    }
    await sleep(400);
    if (!zh[key]) {
      let t = await translateChunk(src, 'zh');
      t = applyGlossary(t, GLOSSARY_ZH);
      zh[key] = t;
    }
    done++;
    if (done % 10 === 0) {
      console.log(`  ${done}/${todo.length} — ${key}`);
      save('en.json', en);
      save('zh.json', zh);
    }
    await sleep(500);
  } catch (e) {
    console.warn(`Skip ${key}: ${e.message}`);
  }
}

/* Fix known bad existing keys */
Object.keys(en).forEach((k) => {
  en[k] = applyGlossary(String(en[k]), GLOSSARY_EN);
});
Object.keys(zh).forEach((k) => {
  zh[k] = applyGlossary(String(zh[k]), GLOSSARY_ZH);
});

save('en.json', en);
save('zh.json', zh);
console.log(`Done. EN keys: ${Object.keys(en).length}, ZH keys: ${Object.keys(zh).length}`);
