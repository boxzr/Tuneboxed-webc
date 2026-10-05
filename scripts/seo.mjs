/**
 * Search metadata for every indexable route.
 *
 * Google sitelinks (the tabs under a search result) are chosen from crawlable
 * pages that are linked with short, unique labels from the home page. Titles,
 * descriptions and those labels live here so the prerendered HTML, the
 * sitemap, and the on-page nav cannot drift.
 *
 * Keep in step with the routes in src/App.tsx and CONTENT_PAGES in
 * src/pages/PageLayout.tsx. A route missing from ROUTES still works for
 * visitors but silently goes back to returning 404 for crawlers.
 */

export const ORIGIN = 'https://tuneboxed.com';

export const ROUTES = [
  {
    path: '/',
    name: 'Home',
    // Leads on the boxing match rather than on being like another product.
    // "Song battle" is the term people search and the competitors own it, so
    // the description has to say what is different in the first line.
    title: 'TuneBoxed | Song battles fought as boxing matches',
    description:
      'Two songs enter the ring and every vote from the room or your Twitch chat lands a punch until one is knocked out. Play free in the browser, on a call, or on stream.',
  },
  {
    path: '/battle',
    name: 'Play',
    title: 'Play | TuneBoxed',
    description:
      'Host or join a TuneBoxed song battle in your browser. Share a five-letter code, pick tracks, and vote through a bracket. No app, no account.',
  },
  {
    path: '/rules',
    name: 'Game rules',
    title: 'Game rules | TuneBoxed',
    description:
      'How TuneBoxed works: songs walk out as boxers, every vote lands a punch, three in a row is a combo. Party is best of three; Bracket runs up to 16 players.',
  },
  {
    path: '/faq',
    name: 'FAQ',
    title: 'FAQ | TuneBoxed',
    description:
      'Answers about TuneBoxed: how the boxing match and combos work, joining from a browser, chat voting, putting the fight on stream, and how long a bracket takes.',
  },
  {
    path: '/streamers',
    name: 'For streamers',
    title: 'For streamers | TuneBoxed',
    description:
      'Put a TuneBoxed song battle on Twitch or TikTok: songs walk out as boxers and chat types 1 or 2 to throw punches. Share the board as a tab or browser source.',
  },
  {
    path: '/winners',
    name: 'Winners',
    title: 'Winners | TuneBoxed',
    description:
      'Songs that won a TuneBoxed bracket. Published by the hosts who ran the battles.',
  },
  {
    path: '/about',
    name: 'About',
    title: 'About | TuneBoxed',
    description:
      'TuneBoxed is a music game: song battles fought as 3D boxing matches in the browser, where every vote lands a punch, and a daily music feed on iOS.',
  },
];

/** Footer and header tabs. Home is the result itself, so it is not a sitelink. */
export const SITELINKS = ROUTES.filter((r) => r.path !== '/');

export function absoluteUrl(path) {
  return path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}`;
}

export function jsonLdFor(route) {
  const url = absoluteUrl(route.path);
  const sitelinkItems = SITELINKS.map((r, i) => ({
    '@type': 'SiteNavigationElement',
    position: i + 1,
    name: r.name,
    url: absoluteUrl(r.path),
  }));

  const graph = [
    {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: 'TuneBoxed',
      url: `${ORIGIN}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${ORIGIN}/logo512.png`,
        width: 512,
        height: 512,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      name: 'TuneBoxed',
      alternateName: ['Tune Boxed', 'TuneBoxed Battle'],
      url: `${ORIGIN}/`,
      inLanguage: 'en-US',
      publisher: { '@id': `${ORIGIN}/#organization` },
      hasPart: sitelinkItems.map((item) => ({
        '@type': 'WebPage',
        name: item.name,
        url: item.url,
      })),
    },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: route.title,
      description: route.description,
      isPartOf: { '@id': `${ORIGIN}/#website` },
      about: { '@id': `${ORIGIN}/#organization` },
      inLanguage: 'en-US',
    },
  ];

  if (route.path === '/') {
    graph.push({
      '@type': 'ItemList',
      '@id': `${ORIGIN}/#sitelinks`,
      name: 'TuneBoxed',
      itemListElement: sitelinkItems,
    });
    graph.push({
      '@type': 'SoftwareApplication',
      name: 'TuneBoxed',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web, iOS',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: `${ORIGIN}/`,
    });
  } else {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'TuneBoxed',
          item: `${ORIGIN}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: route.name,
          item: url,
        },
      ],
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function sitemapXml(lastmod) {
  const urls = ROUTES.map((r) => {
    const loc = absoluteUrl(r.path);
    const priority = r.path === '/' ? '1.0' : '0.8';
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${r.path === '/' ? 'daily' : 'weekly'}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
