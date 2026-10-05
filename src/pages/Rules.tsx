import PageLayout from './PageLayout';
import { CopySection, Steps } from './CopySections';
import { useCopy } from '../i18n/LanguageContext';
import Rich from '../i18n/Rich';

/**
 * How a web battle works. Two formats share a room code and synced playback;
 * they differ in how a winner is decided.
 */
export default function Rules() {
  const t = useCopy().rules;
  return (
    <PageLayout title={t.title} description={t.description} heading={t.heading} intro={t.intro}>
      <section className="page-section">
        <h2>{t.party.heading}</h2>
        <p>{t.party.sub}</p>
        <Steps steps={t.party.steps} />
      </section>

      <section className="page-section">
        <h2>{t.bracket.heading}</h2>
        <p>{t.bracket.sub}</p>
        <Steps steps={t.bracket.steps} />
      </section>

      {t.sections.map((s) => (
        <CopySection key={s.heading} section={s} />
      ))}

      <p>
        <Rich text={t.footer} />
      </p>
    </PageLayout>
  );
}
