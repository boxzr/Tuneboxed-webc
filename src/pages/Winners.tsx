import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';
import * as battle from '../lib/battleClient';
import type { BattleChampion } from '../types/battle';

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
    <PageLayout
      title="Winners | TuneBoxed"
      description="Songs that won a TuneBoxed bracket. Published by the hosts who ran the battles."
      heading="Winners"
      intro="Songs that made it through a whole bracket. Hosts choose whether a battle lands here."
    >
      <section className="page-section">
        {failed && (
          <div className="page-empty">
            The winners board could not be loaded right now. Try again in a
            moment.
          </div>
        )}

        {!failed && champions === null && (
          <div className="page-empty">Loading the board…</div>
        )}

        {!failed && champions !== null && champions.length === 0 && (
          <div className="page-empty">
            No published winners yet. Win a bracket and you can put the song up
            here. <Link to="/battle">Start a battle</Link>.
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
                    {c.winner_display_name && ` · picked by ${c.winner_display_name}`}
                    {c.host_twitch_login && ` · ${c.host_twitch_login}'s room`}
                    {c.player_count > 0 && ` · ${c.player_count} players`}
                  </div>
                </div>
                <div className="page-winner-date">{when(c.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p>
        Read the <Link to="/rules">game rules</Link> or{' '}
        <Link to="/battle">start a battle</Link>.
      </p>
    </PageLayout>
  );
}
