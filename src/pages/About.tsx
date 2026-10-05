import PageLayout, { APP_STORE_URL } from './PageLayout';
import { Paragraphs } from './CopySections';
import Stats from '../components/Stats';
import { useCopy } from '../i18n/LanguageContext';
import Rich from '../i18n/Rich';

export default function About() {
  const copy = useCopy();
  const t = copy.about;
  return (
    <PageLayout title={t.title} description={t.description} heading={t.heading} intro={t.intro}>
      <section className="page-section">
        <h2>{t.battlesHeading}</h2>
        <Paragraphs items={t.battles} />
      </section>

      <section className="page-section">
        <h2>{t.iosHeading}</h2>
        <p>{t.ios}</p>
        <p>
          <a href={APP_STORE_URL} className="app-store-btn" target="_blank" rel="noopener noreferrer">
            {copy.nav.appStore}
          </a>
        </p>
      </section>

      <section className="page-section">
        <Stats heading={copy.stats.heading} />
      </section>

      <section className="page-section">
        <h2>{t.whoHeading}</h2>
        <p>{t.who}</p>
      </section>

      <p>
        <Rich text={t.footer} />
      </p>
    </PageLayout>
  );
}
