/* Run with node scripts/check-document-regressions.cjs.
 * Unit checks use the real i18n engine with a small metadata-only DOM adapter.
 * This does not replace browser rendering or end-to-end form checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { HtmlValidate } = require('html-validate');
const cheerio = require('cheerio');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('news').filter(f => f.endsWith('.html')).map(f => 'news/' + f));
const engine = fs.readFileSync('js/i18n.js', 'utf8');

function metadataTest(file, initialLanguage) {
  const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
  const original = { title: $('title').text(), description: $('meta[name="description"]').attr('content') || '' };
  let description = original.description;
  let ready;
  let savedLanguage;
  const location = new URL('https://example.test/' + file + '?lang=' + initialLanguage);
  const meta = { getAttribute: () => description, setAttribute: (_, value) => { description = value; } };
  const document = {
    title: original.title, documentElement: { lang: 'ru' }, body: { style: {} },
    head: { appendChild() {} },
    createElement: () => ({ dataset: {} }),
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: selector => selector === 'meta[name="description"]' ? meta : null,
    addEventListener: (event, callback) => { if (event === 'DOMContentLoaded') ready = callback; },
    dispatchEvent() {}
  };
  function XMLHttpRequest() {
    this.open = (_, url) => { this.language = url.match(/([a-z]{2})\.json$/)[1]; };
    this.send = () => {
      this.responseText = fs.readFileSync('locales/' + this.language + '.json', 'utf8');
      this.status = 200; this.readyState = 4; this.onreadystatechange();
    };
  }
  const window = { location, history: { replaceState: (_, __, url) => { location.href = new URL(url, location).href; } } };
  const context = { window, document, XMLHttpRequest, URL, URLSearchParams,
    navigator: { language: 'ru' }, CustomEvent: function () {},
    localStorage: { getItem: () => savedLanguage, setItem: (_, value) => { savedLanguage = value; } } };
  vm.runInNewContext(engine, context, { filename: 'js/i18n.js' });
  ready();
  for (const language of [initialLanguage, 'ru', 'en', 'ru', 'zh', 'ja', 'ko', 'ru']) {
    window.PSi18n.setLang(language);
    const dictionary = JSON.parse(fs.readFileSync('locales/' + language + '.json'));
    const prefix = 'meta.' + path.basename(file, '.html').replace(/-/g, '_');
    const expected = suffix => {
      const value = dictionary[prefix + '.' + suffix];
      return language !== 'ru' && value && !String(value).trimStart().startsWith('[TODO]') ? value : original[suffix === 'desc' ? 'description' : suffix];
    };
    assert.equal(document.title, expected('title'), file + ': title / ' + language);
    assert.equal(description, expected('desc'), file + ': description / ' + language);
    assert.equal(document.documentElement.lang, language);
  }
}

(async () => {
  const validator = new HtmlValidate(JSON.parse(fs.readFileSync('.htmlvalidate.json', 'utf8')));
  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /^\s*<!doctype html>/i, file + ': HTML5 doctype');
    assert.match(source, /<html\s[^>]*lang="ru"/i, file + ': default language');
    for (const tag of ['html', 'head', 'body']) {
      assert.equal((source.match(new RegExp('<' + tag + '(?:\\s|>)', 'gi')) || []).length, 1, file + ': one ' + tag);
      assert.equal((source.match(new RegExp('</' + tag + '\\s*>', 'gi')) || []).length, 1, file + ': closing ' + tag);
    }
    assert.equal((await validator.validateFile(file)).valid, true, file + ': validation');
    metadataTest(file, 'ru');
    metadataTest(file, 'en');
  }
  const source = fs.readFileSync('index.html', 'utf8').replace(/<!doctype html>/i, '');
  const negative = await validator.validateString(source, 'index.html');
  assert.equal(negative.valid, false);
  assert(negative.results.some(result => result.messages.some(message => message.ruleId === 'missing-doctype')));
  console.log('PASS: ' + pages.length + ' complete HTML documents; metadata language cycles and direct EN entry; missing-doctype negative check.');
})().catch(error => { console.error(error); process.exitCode = 1; });
