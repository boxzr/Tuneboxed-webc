import { useEffect, useState } from 'react';
import * as battle from '../lib/battleClient';
import type { PublicStats } from '../types/battle';

/** Refresh cadence. Slow on purpose: these are cumulative totals, not a ticker. */
const REFRESH_MS = 30_000;

const LABELS: [keyof PublicStats, string][] = [
  ['battles_played', 'Battles played'],
  ['songs_battled', 'Songs battled'],
  ['players_joined', 'Players'],
  ['champions_crowned', 'Champions'],
];

/**
 * Cumulative counters.
 *
 * Renders nothing until the numbers arrive, and nothing if the request fails.
 * An empty gap is better than a row of zeroes or dashes, which reads as
 * "nobody uses this" whether or not that is true.
 *
 * The heading is passed in rather than written by the caller so that it
 * disappears along with the numbers. Wrapping this in a caller-owned <h2> left
 * the heading stranded above nothing whenever the request failed.
 */
export default function Stats({ heading }: { heading?: string }) {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const next = await battle.getPublicStats();
        if (alive) setStats(next);
      } catch {
        // Counters are decoration. A failure here must not take the page with
        // it, so it is swallowed and the block simply stays hidden.
      }
    };

    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  if (!stats) return null;

  return (
    <>
      {heading && <h2>{heading}</h2>}
      <div className="stats">
        {LABELS.map(([key, label]) => (
          <div className="stat" key={key}>
            <div className="stat-num">{(stats[key] ?? 0).toLocaleString()}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
