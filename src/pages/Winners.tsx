import { useEffect, useState } from 'react';
import PageLayout from './PageLayout';
import * as battle from '../lib/battleClient';
import type { BattleChampion } from '../types/battle';
import { fill, useLanguage } from '../i18n/LanguageContext';
import Rich from '../i18n/Rich';

function when(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Publicly published bracket winners.
 *
 * Only battles a host chose to publish appear, and a name only shows when they
 * also opted into that, so plenty of rows legitimately have no winner name.
 */
export default function Winners() {
  const [champions, setChampions] = useState<BattleChampion[] | null>(null);
  const [failed, setFailed] = useState(false);
  const { copy, locale } = useLanguage();
  const t = copy.winners;

  useEffect(() => {
    let alive = true;
    battle
      .getChampions()
      .then((rows) => alive && setChampions(rows))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageLayout title={t.title} description={t.description} heading={t.heading} intro={t.intro}>
      <section className="page-section">
        {failed && <div className="page-empty">{t.failed}</div>}

        {!failed && champions === null && <div className="page-empty">{t.loading}</div>}

        {!failed && champions !== null && champions.length === 0 && (
          <div className="page-empty">
            <Rich text={t.empty} />
          </div>
        )}

        {champions !== null && champions.length > 0 && (
          <div className="page-winners">
            {champions.map((c) => (
              <div className="page-winner" key={c.id}>
                {c.artwork_url ? (
                  <img className="page-winner-art" src={c.artwork_url} alt="" />
                ) : (
                  <div className="page-winner-art" />
                )}
                <div className="page-winner-text">
                  <div className="page-winner-title">{c.song_title}</div>
                  <div className="page-winner-meta">
                    {c.song_artist}
                    {c.winner_display_name && ` · ${fill(t.pickedBy, { name: c.winner_display_name })}`}
                    {c.host_twitch_login && ` · ${fill(t.room, { name: c.host_twitch_login })}`}
                    {c.player_count > 0 && ` · ${fill(t.players, { count: c.player_count })}`}
                  </div>
                </div>
                <div className="page-winner-date">{when(c.created_at, locale)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p>
        <Rich text={t.footer} />
      </p>
    </PageLayout>
  );
}
