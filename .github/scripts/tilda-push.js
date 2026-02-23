/**
 * tilda-push.js
 * =============
 * Called by GitHub Actions to sync this repo's HTML pages to Tilda.
 *
 * Required environment variables (set as GitHub Secrets):
 *   TILDA_PUBLIC_KEY  — public API key from Tilda settings
 *   TILDA_SECRET_KEY  — secret API key from Tilda settings
 *   TILDA_PROJECT_ID  — numeric project ID (see Tilda URL)
 *   CDN_BASE          — injected automatically by the workflow
 *
 * Tilda page-ID map (fill in after running `node tilda-push.js --list`):
 *   Edit the PAGE_MAP below once you have your Tilda page IDs.
 */

'use strict';

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const qs     = require('querystring');

/* ── Config ──────────────────────────────────────────────────── */
const PUB  = process.env.TILDA_PUBLIC_KEY;
const SEC  = process.env.TILDA_SECRET_KEY;
const PROJ = process.env.TILDA_PROJECT_ID;
const CDN  = process.env.CDN_BASE ||
  'https://cdn.jsdelivr.net/gh/bossssmann-ui/pacificstar.ru@main';

/* ── Page map: localFile → Tilda pageId ─────────────────────── */
/* Fill these in after running --list (see instructions below)   */
const PAGE_MAP = {
  // 'index.html':          '12345678',
  // 'about.html':          '12345679',
  // 'services.html':       '12345680',
  // 'contacts.html':       '12345681',
  // 'remote-regions.html': '12345682',
  // 'account.html':        '12345683',
};

/* ── CDN injection snippet (added before </head>) ───────────── */
const CDN_SNIPPET = `
<!-- Pacific Star assets loaded from GitHub CDN -->
<link rel="stylesheet" href="${CDN}/css/style.css">
<script>window.PS_CDN = '${CDN}';</script>
`.trim();

const CDN_SCRIPTS = `
<!-- Pacific Star scripts loaded from GitHub CDN -->
<script src="${CDN}/js/main.js" defer></script>
<script src="${CDN}/js/i18n.js" defer></script>
<script src="${CDN}/js/map.js" defer></script>
<script src="${CDN}/js/currency.js" defer></script>
<script src="${CDN}/js/calculator.js" defer></script>
`.trim();

/* ── Helpers ─────────────────────────────────────────────────── */
function apiGet(endpoint, params) {
  return new Promise(function (resolve, reject) {
    var query = qs.stringify(Object.assign({ publickey: PUB, secretkey: SEC }, params));
    var options = {
      hostname: 'api.tildacdn.info',
      path:     '/v1/' + endpoint + '/?' + query,
      method:   'GET'
    };
    var req = https.request(options, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end',  function ()  {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function apiPost(endpoint, params) {
  return new Promise(function (resolve, reject) {
    var body = qs.stringify(Object.assign({ publickey: PUB, secretkey: SEC }, params));
    var options = {
      hostname: 'api.tildacdn.info',
      path:     '/v1/' + endpoint + '/',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(options, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end',  function ()  {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/* ── Inject CDN references into local HTML ───────────────────── */
function injectCdn(html) {
  if (html.indexOf('PS_CDN') === -1) {
    html = html.replace('</head>', CDN_SNIPPET + '\n</head>');
  }
  if (html.indexOf('main.js') === -1) {
    html = html.replace('</body>', CDN_SCRIPTS + '\n</body>');
  }
  return html;
}

/* ── Main ─────────────────────────────────────────────────────── */
async function main() {
  if (!PUB || !SEC || !PROJ) {
    console.log('⚠  TILDA_PUBLIC_KEY / TILDA_SECRET_KEY / TILDA_PROJECT_ID not set.');
    console.log('   Run this script with --list to see your page IDs.');
    process.exit(0);
  }

  /* --list mode: print all pages so user can fill PAGE_MAP */
  if (process.argv.includes('--list')) {
    var list = await apiGet('getpageslist', { projectid: PROJ });
    console.log('📄 Pages in project', PROJ);
    (list.result || []).forEach(function (p) {
      console.log('  id=' + p.id + '  slug=/' + p.alias + '  title=' + p.title);
    });
    return;
  }

  var entries = Object.entries(PAGE_MAP);
  if (entries.length === 0) {
    console.log('ℹ  PAGE_MAP is empty. Add entries to .github/scripts/tilda-push.js');
    console.log('   Run with --list to get your Tilda page IDs first.');
    process.exit(0);
  }

  var errors = 0;
  for (var [file, pageId] of entries) {
    var filePath = path.resolve(__dirname, '../../', file);
    if (!fs.existsSync(filePath)) {
      console.warn('⚠  File not found: ' + file);
      continue;
    }
    var html = fs.readFileSync(filePath, 'utf8');
    html = injectCdn(html);

    console.log('⬆  Pushing ' + file + ' → Tilda page ' + pageId + ' …');
    try {
      var res = await apiPost('updatepage', { pageid: pageId, html: html });
      if (res.status === 'FOUND') {
        console.log('   ✅ Updated successfully');
      } else {
        console.error('   ❌ Error:', JSON.stringify(res));
        errors++;
      }
    } catch (err) {
      console.error('   ❌ Request failed:', err.message);
      errors++;
    }

    /* Tilda rate limit: 150 req/hour → ~2.4s between requests */
    await new Promise(function (r) { setTimeout(r, 2500); });
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch(function (e) { console.error(e); process.exit(1); });
