import PageLayout from './PageLayout';
import { useCopy } from '../i18n/LanguageContext';
import Rich, { plain } from '../i18n/Rich';

/**
 * Answers are rendered inside <details>, which keeps them in the DOM while
 * collapsed so they are still readable by crawlers, and mirrored into FAQPage
 * structured data below.
 */
export default function Faq() {
  const t = useCopy().faq;

  // Structured data so the answers are eligible to surface directly in search
  // results. Kept generated from the same array as the page so the two cannot
  // say different things.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
    })),
  };

  return (
    <PageLayout title={t.title} description={t.description} heading={t.heading} intro={t.intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-section page-faq">
        {t.items.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <div className="page-faq-answer">
              <p>
                <Rich text={f.a} />
              </p>
            </div>
          </details>
        ))}
      </section>

      <p>
        <Rich text={t.footer} />
      </p>
    </PageLayout>
  );
}
