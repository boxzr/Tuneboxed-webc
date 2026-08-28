import { Monogram } from './primitives';
import { CheckIcon, CrownIcon } from './icons';
import type { BattlePlayer } from '../../types/battle';

export type RosterStatus = 'picking' | 'locked' | null;

/**
 * The player list, shared by the lobby and every round phase.
 *
 * The lobby wants empty seats shown so a host reading a code out can see there
 * is room for more; mid-round that would be noise, so `waitingSlots` is opt in.
 */
export default function Roster({
  players,
  hostId,
  judgeId,
  meId,
  statusOf,
  waitingSlots = 0,
}: {
  players: BattlePlayer[];
  hostId: string | null;
  judgeId?: string | null;
  meId: string | null;
  /** Per-player pick state during the picking phase. */
  statusOf?: (player: BattlePlayer) => RosterStatus;
  waitingSlots?: number;
}) {
  return (
    <ul className="bt-roster">
      {players.map((p) => {
        const status = statusOf?.(p) ?? null;
        return (
          <li key={p.id} className="bt-player">
            <Monogram name={p.display_name} />

            <span className="bt-player__name">{p.display_name}</span>

            {hostId === p.id && <span className="bt-tag bt-tag--host">Host</span>}
            {judgeId === p.id && (
              <span className="bt-tag bt-tag--judge">
                <CrownIcon size={11} />
                Judge
              </span>
            )}
            {p.id === meId && <span className="bt-tag bt-tag--you">You</span>}

            <span className="bt-player__trail">
              {status === 'locked' ? (
                <span className="bt-player__locked">
                  <CheckIcon size={16} />
                </span>
              ) : status === 'picking' ? (
                <span className="bt-player__picking">Picking</span>
              ) : (
                <span
                  className={`bt-dot${p.is_connected ? '' : ' bt-dot--away'}`}
                  title={p.is_connected ? 'Connected' : 'Away'}
                />
              )}
            </span>
          </li>
        );
      })}

      {Array.from({ length: waitingSlots }, (_, i) => (
        <li key={`slot-${i}`} className="bt-player bt-player--empty">
          Waiting for a player
        </li>
      ))}
    </ul>
  );
}
