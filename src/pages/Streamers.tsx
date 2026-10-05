import PageLayout from './PageLayout';
import { CopySection, Steps } from './CopySections';
import { useCopy } from '../i18n/LanguageContext';
import Rich from '../i18n/Rich';

export default function Streamers() {
  const t = useCopy().streamers;
  return (
    <PageLayout title={t.title} description={t.description} heading={t.heading} intro={t.intro}>
      <section className="page-section">
        <h2>{t.setupHeading}</h2>
        <Steps steps={t.steps} />
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
