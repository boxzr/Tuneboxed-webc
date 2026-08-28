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
    title: 'TuneBoxed | The Kahoot of song battles',
    description:
      'Everyone picks a track, the room hears it together, and a bracket picks the winner. Play in the browser around a table, on a call, or on stream.',
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
      'How a TuneBoxed song battle works: a bracket of up to 16 players, songs played in sync, and the room voting for the winner.',
  },
  {
    path: '/faq',
    name: 'FAQ',
    title: 'FAQ | TuneBoxed',
    description:
      'Answers about TuneBoxed song battles: joining from a browser, chat voting, putting the board on stream, and how long a bracket takes.',
  },
  {
    path: '/streamers',
    name: 'For streamers',
    title: 'For streamers | TuneBoxed',
    description:
      'Put a TuneBoxed song battle on Twitch or TikTok. Share the board as a tab or a browser source, and let chat vote by typing 1 or 2.',
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
      'TuneBoxed is a music game: bracket song battles in the browser, and a daily music feed on iOS where you post the song that fits the genre.',
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
