import PageLayout from './PageLayout';
import { CopySection, Paragraphs, Steps } from './CopySections';
import { songBattle as t } from './songBattleCopy';
import Rich, { plain } from '../i18n/Rich';

export default function SongBattle() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
    })),
  };

  return (
    <PageLayout title={t.title} description={t.description} heading={t.heading} intro={t.intro}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-section">
        <h2>{t.whatHeading}</h2>
        <Paragraphs items={t.what} />
      </section>

      <section className="page-section">
        <h2>{t.howHeading}</h2>
        <Steps steps={t.steps} />
      </section>

      {t.sections.map((s) => (
        <CopySection key={s.heading} section={s} />
      ))}

      <section className="page-section">
        <h2>{t.ideasHeading}</h2>
        <p>{t.ideasIntro}</p>
        <ul className="page-ideas">
          {t.ideas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </section>

      <section className="page-section page-faq">
        <h2>{t.faqHeading}</h2>
        {t.faq.map((f) => (
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
