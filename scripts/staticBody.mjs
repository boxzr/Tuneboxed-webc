/**
 * The readable text of each indexable page, as plain HTML for the prerender.
 *
 * Every route ships the same empty app shell, so without this a crawler that
 * does not run JavaScript (or has not got round to it yet) sees no words on
 * the page at all. This builds the same headings and copy the React page
 * renders, from the same English copy, and createRoot replaces it on boot.
 */

import { en } from '../src/i18n/content/en.ts';
import { songBattle } from '../src/pages/songBattleCopy.ts';
import { ROUTES } from './seo.mjs';

const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** <Rich> markup to HTML. */
export function rich(text) {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    out += esc(text.slice(last, m.index));
    const [, label, href, bold, code] = m;
    if (label !== undefined) out += `<a href="${esc(href)}">${esc(label)}</a>`;
    else if (bold !== undefined) out += `<strong>${esc(bold)}</strong>`;
    else out += `<code>${esc(code)}</code>`;
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

const p = (text) => `<p>${rich(text)}</p>`;
const ps = (items) => items.map(p).join('');
const h2 = (text) => `<h2>${esc(text)}</h2>`;

function steps(list) {
  const items = list.map(
    (s) => `<li><h3>${esc(s.title)}</h3>${s.body ? p(s.body) : ''}${s.paragraphs ? ps(s.paragraphs) : ''}</li>`
  );
  return `<ol>${items.join('')}</ol>`;
}

function section(s) {
  const parts = (s.parts ?? []).map((part) => `<h3>${esc(part.title)}</h3>${ps(part.paragraphs)}`);
  return `<section>${h2(s.heading)}${ps(s.paragraphs)}${parts.join('')}</section>`;
}

function faq(items) {
  return items.map((f) => `<h3>${esc(f.q)}</h3>${p(f.a)}`).join('');
}

function page(heading, intro, body) {
  return `<h1>${esc(heading)}</h1>${intro ? `<p>${esc(intro)}</p>` : ''}${body}`;
}

const MAIN = {
  '/': () => {
    const h = en.home;
    return [
      `<h1>${esc(h.headline)} <em>${esc(h.headlineEm)}</em></h1>`,
      p(h.lede),
      p(h.sub),
      h2(h.howTitle),
      p(h.howSub),
      `<ul>${h.points.map((pt) => `<li><strong>${esc(pt.title)}</strong> ${esc(pt.body)}</li>`).join('')}</ul>`,
      `<ol>${h.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`,
      `<p><a href="/battle">${esc(en.nav.startBattle)}</a> · <a href="/song-battle">What is a song battle?</a> · <a href="/streamers">${esc(h.streamersLink)}</a></p>`,
    ].join('');
  },
  '/battle': () => page(en.entry.hostTitle, en.entry.hostSub, ''),
  '/song-battle': () => {
    const t = songBattle;
    return page(
      t.heading,
      t.intro,
      [
        `<section>${h2(t.whatHeading)}${ps(t.what)}</section>`,
        `<section>${h2(t.howHeading)}${steps(t.steps)}</section>`,
        ...t.sections.map(section),
        `<section>${h2(t.ideasHeading)}${p(t.ideasIntro)}<ul>${t.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>`,
        `<section>${h2(t.faqHeading)}${faq(t.faq)}</section>`,
        p(t.footer),
      ].join('')
    );
  },
  '/rules': () => {
    const t = en.rules;
    return page(
      t.heading,
      t.intro,
      [
        `<section>${h2(t.party.heading)}${p(t.party.sub)}${steps(t.party.steps)}</section>`,
        `<section>${h2(t.bracket.heading)}${p(t.bracket.sub)}${steps(t.bracket.steps)}</section>`,
        ...t.sections.map(section),
        p(t.footer),
      ].join('')
    );
  },
  '/faq': () => page(en.faq.heading, en.faq.intro, faq(en.faq.items) + p(en.faq.footer)),
  '/streamers': () => {
    const t = en.streamers;
    return page(
      t.heading,
      t.intro,
      `<section>${h2(t.setupHeading)}${steps(t.steps)}</section>${t.sections.map(section).join('')}${p(t.footer)}`
    );
  },
  '/winners': () => page(en.winners.heading, en.winners.intro, p(en.winners.footer)),
  '/about': () => {
    const t = en.about;
    return page(
      t.heading,
      t.intro,
      [
        `<section>${h2(t.battlesHeading)}${ps(t.battles)}</section>`,
        `<section>${h2(t.iosHeading)}${p(t.ios)}</section>`,
        `<section>${h2(t.whoHeading)}${p(t.who)}</section>`,
        p(t.footer),
      ].join('')
    );
  },
};

/** Links to every indexable page, so the static HTML is crawlable on its own. */
function links() {
  return ROUTES.map((r) => `<a href="${r.path}">${esc(r.path === '/' ? 'TuneBoxed' : r.name)}</a>`).join(' · ');
}

export function staticBody(path) {
  const main = MAIN[path];
  if (!main) throw new Error(`no static body for ${path}`);
  return `<div class="prerender"><nav>${links()}</nav><main>${main()}</main></div>`;
}
