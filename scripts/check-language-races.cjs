/* Exercise the real i18n engine with controlled, out-of-order dictionary replies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
process.chdir(path.resolve(__dirname, '..'));
let ready;
let saved = 'ru';
let description = 'Russian description';
const pending = [];
const location = new URL('https://example.test/index.html');
const meta = { getAttribute: () => description, setAttribute: (_, value) => { description = value; } };
const document = {
  title: 'Russian title', documentElement: { lang: 'ru' }, body: { style: {} },
  querySelector: selector => selector === 'meta[name="description"]' ? meta : null,
  querySelectorAll: () => [], getElementById: () => null,
  addEventListener: (event, callback) => { if (event === 'DOMContentLoaded') ready = callback; },
  dispatchEvent() {}
};
function XMLHttpRequest() {
  this.open = (_, url) => { this.language = url.match(/([a-z]{2})\.json$/)[1]; };
  this.send = () => { pending.push(this); };
}
const window = { location, history: { replaceState: (_, __, url) => { location.href = new URL(url, location).href; } } };
vm.runInNewContext(fs.readFileSync('js/i18n.js', 'utf8'), {
  document, window, XMLHttpRequest, URL, URLSearchParams,
  navigator: { language: 'ru' }, CustomEvent: function () {},
  localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } }
});
ready();
function reply(language) {
  const index = pending.findIndex(request => request.language === language);
  assert(index >= 0, 'Expected pending ' + language);
  const request = pending.splice(index, 1)[0];
  request.responseText = fs.readFileSync('locales/' + language + '.json', 'utf8');
  request.status = 200; request.readyState = 4; request.onreadystatechange();
}
window.PSi18n.setLang('en');
window.PSi18n.setLang('ru');
reply('en');
assert.equal(document.documentElement.lang, 'ru', 'Late EN reply must not replace the latest RU selection');
assert.equal(document.title, 'Russian title');
assert.equal(description, 'Russian description');
window.PSi18n.setLang('zh');
window.PSi18n.setLang('ja');
reply('ja');
const latestTitle = document.title;
const latestDescription = description;
reply('zh');
assert.equal(document.documentElement.lang, 'ja', 'Older ZH reply must not replace JA');
assert.equal(document.title, latestTitle);
assert.equal(description, latestDescription);
assert.equal(window.PSi18n.getLang(), 'ja');
window.PSi18n.setLang('ko');
window.PSi18n.setLang('en'); // EN is cached but must invalidate an older pending KO.
reply('ko');
assert.equal(document.documentElement.lang, 'en');
assert.equal(window.PSi18n.getLang(), 'en');
window.PSi18n.setLang('ru');
assert.equal(document.title, 'Russian title');
console.log('PASS: late replies cannot override RU, a newer fetched language, or a cached language.');
