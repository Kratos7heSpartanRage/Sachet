// Quick sanity tests for masking + rule engine: `npm test`
const assert = require('assert');
const { maskPII, detect } = require('../public/js/rules.js');
const { SAMPLES } = require('../public/js/i18n.js');

const m = maskPII('Pay to rahul.k@okaxis or mail a.b@gmail.com, call +91 98765 43210, PAN ABCDE1234F');
assert(!/okaxis|gmail|98765|ABCDE1234F/.test(m.masked), 'PII must be masked: ' + m.masked);
assert(m.counts.UPI_ID === 1 && m.counts.EMAIL === 1 && m.counts.PHONE === 1 && m.counts.PAN === 1, JSON.stringify(m.counts));

const expected = { s1: 'High', s2: 'High', s3: 'High', s4: 'High', s5: 'High', s6: 'High', s7: 'High', s8: 'Unclear', s9: 'Medium' };
for (const s of SAMPLES) {
  const r = detect(maskPII(s.text).masked);
  console.log(s.id.padEnd(3), r.risk.padEnd(8), r.hits.map((h) => h.id).join(', '));
  assert.strictEqual(r.risk, expected[s.id], `${s.id} expected ${expected[s.id]} got ${r.risk}`);
}
assert.strictEqual(detect('Never share your OTP with anyone. Mutual funds are subject to market risks.').risk, 'Unclear');
console.log('All tests passed ✔');
