// Regression tests against the live APIs: every result must carry the license
// that was asked for. Run with: node --test tests/
// Openverse allows 200 anonymous requests per day, so it gets a single call.
const test = require('node:test');
const assert = require('node:assert');
const S = require('../sources.js');

// Wikimedia rejects non-browser clients without a User-Agent.
S.headers = { 'User-Agent': 'FreeLicenseImageFinder-tests/1.0 (https://github.com/juanaustral/freelicense-image-finder)' };

const FILTERS = { 'cc0': ['cc0'], 'pdm': ['pdm'], 'cc0,pdm': ['cc0', 'pdm'] };

for (const query of ['cat', 'mountain', 'office']) {
  for (const filter of Object.keys(FILTERS)) {
    test(`Commons "${query}" ${filter}: full page, only the requested license`, async () => {
      const r = await S.searchCommons({ query, filter, offset: 0 });
      assert.ok(r.results.length >= 15, `only ${r.results.length} results`);
      for (const img of r.results) {
        assert.ok(FILTERS[filter].includes(img.license), `${img.title}: ${img.license}`);
        assert.match(img.thumb, /^https:\/\//);
        assert.match(img.pageUrl, /^https:\/\/commons\.wikimedia\.org\//);
        assert.ok(img.licenseUrl, `${img.title}: no license link`);
      }
    });
  }
}

test('Commons pagination returns new files', async () => {
  const p1 = await S.searchCommons({ query: 'lighthouse', filter: 'cc0,pdm', offset: 0 });
  const p2 = await S.searchCommons({ query: 'lighthouse', filter: 'cc0,pdm', offset: p1.nextOffset });
  const first = new Set(p1.results.map((r) => r.url));
  assert.ok(p2.results.length > 0);
  assert.ok(p2.results.every((r) => !first.has(r.url)));
});

test('Openverse "cat" cc0,pdm: only CC0/PDM, thumbnails, no Commons duplicates', async () => {
  const r = await S.searchOpenverse({ query: 'cat', filter: 'cc0,pdm', page: 1, excludeWikimedia: true });
  assert.ok(r.results.length > 0);
  for (const img of r.results) {
    assert.ok(['cc0', 'pdm'].includes(img.license), `${img.title}: ${img.license}`);
    assert.match(img.thumb, /^https:\/\/api\.openverse\.org\/v1\/images\/.+\/thumb\/$/);
    assert.notStrictEqual(img.provider, 'Wikimedia Commons');
  }
});

test('Spanish queries are translated; English and unknown ones are not', async () => {
  const cases = {
    'gato': 'cat', 'gatos': 'cat', 'montaña': 'mountain', 'flores': 'flower', 'textura': 'texture',
    'gato negro': 'black cat', 'ciudad de noche': 'city night', 'árboles': 'tree',
    'cat': null, 'sunset': null, 'office': null, 'Buenos Aires': null,
  };
  for (const [es, en] of Object.entries(cases)) {
    assert.strictEqual(await S.translateQuery(es), en, es);
  }
});

test('Commons license classification', () => {
  const lic = (short, copyrighted) => S.commonsLicense({
    LicenseShortName: { value: short }, Copyrighted: { value: copyrighted },
  });
  assert.strictEqual(lic('CC0', 'True'), 'cc0');
  assert.strictEqual(lic('Public domain', 'False'), 'pdm');
  assert.strictEqual(lic('CC BY-SA 4.0', 'True'), null);
  assert.strictEqual(lic('GFDL', 'True'), null);
});
