/* Execute the real analytics module with providers already present and consent changes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
process.chdir(path.resolve(__dirname, '..'));
let consent = 'essential';
let storageBlocked = false;
const calls = [];
const scripts = [];
const listeners = {};
const documentListeners = {};
const scriptParent = { insertBefore: element => scripts.push(element.src) };
const document = {
  scripts: [], createElement: () => ({}),
  getElementsByTagName: () => [{ parentNode: scriptParent }],
  head: { appendChild: element => scripts.push(element.src) },
  addEventListener: (name, callback) => { documentListeners[name] = callback; }
};
const window = {
  PS_YM_ID: 123, PS_GA_ID: 'G-TEST0000', location: { pathname: '/contacts.html' },
  ym: (...args) => calls.push(args), gtag: (...args) => calls.push(args), dataLayer: [],
  addEventListener: (name, callback, options) => { listeners[name] = { callback, once: options && options.once }; }
};
function emitConsent() {
  const listener = listeners['ps:analytics-consent'];
  if (!listener) return;
  if (listener.once) delete listeners['ps:analytics-consent'];
  listener.callback();
}
vm.runInNewContext(fs.readFileSync('js/analytics.js', 'utf8'), {
  window, document, localStorage: { getItem: () => { if (storageBlocked) throw Error('disabled'); return consent; } }
});
window.PSTrack('lead_accepted', { form_id: 'contactForm' });
assert.equal(calls.length, 0, 'No event without consent even when provider functions already exist');
assert.equal(window.dataLayer.length, 0);
emitConsent();
assert.equal(scripts.length, 0, 'A notification without saved consent must not load providers');
documentListeners.focusin({ target: { form: { id: 'contactForm' } } });
consent = 'all';
emitConsent();
assert.equal(scripts.length, 2, 'A later valid grant still boots both providers');
emitConsent();
assert.equal(scripts.length, 2, 'Repeated grant must not initialize providers twice');
assert.equal(calls.filter(args => args[1] === 'reachGoal').length, 0, 'No replay of earlier denied events');
documentListeners.focusin({ target: { form: { id: 'contactForm' } } });
documentListeners.focusin({ target: { form: { id: 'contactForm' } } });
assert.equal(calls.filter(args => args[1] === 'reachGoal' && args[2] === 'form_start').length, 1);
window.PSTrack('lead_accepted', { form_id: 'contactForm' });
assert.equal(calls.filter(args => args[1] === 'reachGoal' && args[2] === 'lead_accepted').length, 1);
const before = [calls.length, window.dataLayer.length];
consent = 'essential';
window.PSTrack('lead_accepted');
assert.deepEqual([calls.length, window.dataLayer.length], before, 'Explicit events stop after consent is withdrawn');
consent = 'all'; storageBlocked = true;
window.PSTrack('lead_accepted');
emitConsent();
assert.deepEqual([calls.length, window.dataLayer.length], before, 'Unreadable consent fails closed');
console.log('PASS: consent gates provider boot, explicit events and new form interactions; no replay or duplicate boot.');
