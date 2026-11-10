import PageLayout from './PageLayout';
import HowToPlay from '../components/HowToPlay';
import { useCopy } from '../i18n/LanguageContext';

/**
 * The walkthrough on its own tab. It carries its own heading beside the ring,
 * so the layout only supplies the nav, the footer and a wider column.
 */
export default function HowToPlayPage() {
  const t = useCopy().tutorial;
  return (
    <PageLayout title={t.pageTitle} description={t.pageDescription} wide>
      <HowToPlay />
    </PageLayout>
  );
}
