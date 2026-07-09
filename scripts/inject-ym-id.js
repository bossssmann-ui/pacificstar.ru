#!/usr/bin/env node
/**
 * Injects Yandex Metrika counter ID into js/config.js at deploy time.
 * Reads PS_YM_ID from environment (GitHub Actions secret).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ymId = String(process.env.PS_YM_ID || '').trim();
const configPath = path.join(__dirname, '..', 'js', 'config.js');

if (!ymId) {
  console.log('PS_YM_ID not set — Metrika stays disabled (0)');
  process.exit(0);
}

if (!/^\d{5,12}$/.test(ymId)) {
  console.error('PS_YM_ID must be a numeric Yandex Metrika counter ID (5–12 digits)');
  process.exit(1);
}

let content = fs.readFileSync(configPath, 'utf8');
const pattern = /window\.PS_YM_ID\s*=\s*window\.PS_YM_ID\s*\|\|\s*\d+;/;

if (!pattern.test(content)) {
  console.error('Could not find PS_YM_ID line in js/config.js');
  process.exit(1);
}

content = content.replace(pattern, `window.PS_YM_ID    = window.PS_YM_ID    || ${ymId};`);
fs.writeFileSync(configPath, content);
console.log(`Injected PS_YM_ID=${ymId} into js/config.js`);
