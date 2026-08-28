import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, SITELINKS, ORIGIN, jsonLdFor, sitemapXml, absoluteUrl } from './seo.mjs';

test('every indexable page is named TuneBoxed, not Tuneboxed', () => {
  for (const r of ROUTES) {
    assert.match(r.title, /TuneBoxed/);
    assert.doesNotMatch(r.title, /Tuneboxed[^B]/);
  }
});

test('titles and sitelink labels are unique, so the tabs do not collide', () => {
  const titles = ROUTES.map((r) => r.title);
  const names = SITELINKS.map((r) => r.name);
  assert.equal(new Set(titles).size, titles.length);
  assert.equal(new Set(names).size, names.length);
});

test('descriptions sit in the length Google actually shows', () => {
  for (const r of ROUTES) {
    assert.ok(
      r.description.length >= 70 && r.description.length <= 165,
      `${r.path} description is ${r.description.length} chars`
    );
  }
});

test('sitelinks are the pages a search result would tab to', () => {
  const names = SITELINKS.map((r) => r.name);
  for (const expected of ['Play', 'Game rules', 'FAQ', 'For streamers', 'Winners', 'About']) {
    assert.ok(names.includes(expected), `missing sitelink ${expected}`);
  }
  assert.ok(!SITELINKS.some((r) => r.path === '/'));
});

test('homepage structured data names the site and lists the tabs', () => {
  const graph = jsonLdFor(ROUTES[0])['@graph'];
  const site = graph.find((n) => n['@type'] === 'WebSite');
  assert.equal(site.name, 'TuneBoxed');
  const list = graph.find((n) => n['@type'] === 'ItemList');
  assert.equal(list.itemListElement.length, SITELINKS.length);
  assert.equal(list.itemListElement[0].url.startsWith(ORIGIN), true);
});

test('inner pages carry a breadcrumb back to TuneBoxed', () => {
  const rules = ROUTES.find((r) => r.path === '/rules');
  const graph = jsonLdFor(rules)['@graph'];
  const crumbs = graph.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
  assert.equal(crumbs[0].name, 'TuneBoxed');
  assert.equal(crumbs[1].name, 'Game rules');
  assert.equal(crumbs[1].item, absoluteUrl('/rules'));
});

test('sitemap lists every indexable URL once', () => {
  const xml = sitemapXml('2026-08-28');
  for (const r of ROUTES) {
    assert.ok(xml.includes(`<loc>${absoluteUrl(r.path)}</loc>`));
  }
  assert.equal((xml.match(/<url>/g) || []).length, ROUTES.length);
});
