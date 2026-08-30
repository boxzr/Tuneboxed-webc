import type { ReactNode } from 'react';
import { Card, SectionLabel } from './ui/primitives';
import { SlidersIcon } from './ui/icons';
import { defaultPlayStyle, isClassic } from './playStyle';
import type { BattleFormat, BattlePlayStyle, BattleRoom, BattleVotingMode } from '../types/battle';

const VOTING: Record<
  BattleVotingMode,
  { short: string; title: string; detail: string }
> = {
  judge: {
    short: 'Judge',
    title: 'Rotating judge',
    detail: 'A different player crowns the winner each round.',
  },
  host: {
    short: 'Host',
    title: 'Host only',
    detail: 'Only you pick the winner.',
  },
  everyone: {
    short: 'Everyone',
    title: 'Everyone votes',
    detail: 'The room votes. Players cannot vote for their own song.',
  },
};

/**
 * Who is actually deciding, after the format has had a chance to override
 * the stored setting. A bracket cannot use a rotating judge, so that choice
 * is treated as a room vote.
 */
export function resolvedVoting(room: BattleRoom): BattleVotingMode {
  if (room.format === 'bracket' && room.voting_mode === 'judge') return 'everyone';
  return room.voting_mode;
}

export function rulesSummary(room: BattleRoom, aiJudge: boolean): string {
  const format = room.format === 'bracket' ? 'Bracket' : 'Best of 3';
  const style = isClassic(room) ? 'Classic' : 'TuneBoxed';
  const judging = aiJudge ? 'AI judge' : VOTING[resolvedVoting(room)].title;
  return `${format} · ${style} · ${judging}`;
}

type Patch = {
  hostSpeakerEnabled?: boolean;
  votingMode?: BattleVotingMode;
  format?: BattleFormat;
  maxPlayers?: number;
  playStyle?: BattlePlayStyle;
  theme?: string | null;
};

/**
 * Host-only room controls, the web counterpart to BattleRoomSettingsView.
 *
 * Format and capacity only apply in the lobby. Mid-game they would orphan
 * whatever is already in flight, so they are hidden rather than shown disabled.
 */
export function GameSettingsPanel({
  room,
  playerCount,
  aiJudge,
  onChange,
}: {
  room: BattleRoom;
  playerCount: number;
  aiJudge: boolean;
  onChange: (patch: Patch) => void;
}) {
  const isBracket = room.format === 'bracket';
  const inLobby = room.status === 'lobby';
  const classic = isClassic(room);
  const voting = resolvedVoting(room);
  const votingOptions: BattleVotingMode[] = isBracket ? ['host', 'everyone'] : ['judge', 'host', 'everyone'];
  const hostOnly = room.host_speaker_enabled === true;

  return (
    <Card className="bt-settings-panel">
      <SectionLabel>Game settings</SectionLabel>

      <SettingsBlock
        title="Audio"
        subtitle={
          hostOnly
            ? 'Only this tab plays the songs. Everyone else follows on screen.'
            : 'Every device in the room plays the songs in sync.'
        }
      >
        <Segmented
          value={hostOnly ? 'host' : 'all'}
          options={[
            { id: 'all', label: 'Everyone' },
            { id: 'host', label: 'Host only' },
          ]}
          onChange={(id) => onChange({ hostSpeakerEnabled: id === 'host' })}
        />
      </SettingsBlock>

      <SettingsBlock
        title="Who votes"
        subtitle={
          aiJudge
            ? 'Just the two of you, so the AI judge calls each matchup. Add a third player to vote yourselves.'
            : VOTING[voting].detail
        }
      >
        <Segmented
          value={voting}
          options={votingOptions.map((id) => ({ id, label: VOTING[id].short }))}
          disabled={aiJudge}
          onChange={(id) => onChange({ votingMode: id })}
        />
      </SettingsBlock>

      {inLobby && (
        <SettingsBlock
          title="Format"
          subtitle={
            isBracket
              ? 'Head to head until one song is left. Up to 16 players.'
              : 'Everyone picks each round. A judge crowns a winner. Best of three.'
          }
        >
          <Segmented
            value={room.format}
            options={[
              { id: 'rounds', label: 'Party' },
              { id: 'bracket', label: 'Bracket' },
            ]}
            onChange={(id) =>
              onChange({
                format: id,
                playStyle: defaultPlayStyle(id),
                votingMode: id === 'bracket' && voting === 'judge' ? 'everyone' : voting,
              })
            }
          />
        </SettingsBlock>
      )}

      {inLobby && (
        <SettingsBlock
          title="Style"
          subtitle={
            classic
              ? 'You pick one vibe for the whole game. Players lock a song in before anything starts, with no clock.'
              : 'A fresh random vibe each round. Players have 45 seconds to pick once the round is live.'
          }
        >
          <Segmented
            value={classic ? 'classic' : 'tuneboxed'}
            options={[
              { id: 'classic', label: 'Classic' },
              { id: 'tuneboxed', label: 'TuneBoxed' },
            ]}
            onChange={(id) => onChange({ playStyle: id })}
          />
        </SettingsBlock>
      )}

      {inLobby && isBracket && (
        <SettingsBlock title="Room size" subtitle="Odd counts get a first-round bye.">
          <div className="bt-stepper">
            <span className="bt-stepper__value">{room.max_players} players</span>
            <div className="bt-stepper__btns">
              <button
                type="button"
                disabled={room.max_players <= 2}
                onClick={() => onChange({ maxPlayers: Math.max(2, room.max_players - 2) })}
              >
                −
              </button>
              <button
                type="button"
                disabled={room.max_players >= 16}
                onClick={() => onChange({ maxPlayers: Math.min(16, room.max_players + 2) })}
              >
                +
              </button>
            </div>
          </div>
          {playerCount > room.max_players && (
            <p className="bt-sub" style={{ margin: '8px 0 0' }}>
              {playerCount} players are already in. A lower cap only applies to new joins.
            </p>
          )}
        </SettingsBlock>
      )}
    </Card>
  );
}

export function GameSettingsButton({
  summary,
  open,
  onClick,
}: {
  summary: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`bt-settings-btn${open ? ' bt-settings-btn--open' : ''}`}
      onClick={onClick}
      aria-expanded={open}
    >
      <SlidersIcon size={16} />
      <span className="bt-settings-btn__label">Game settings</span>
      <span className="bt-settings-btn__summary">{summary}</span>
    </button>
  );
}

function SettingsBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="bt-settings-block">
      <SectionLabel tone="orange">{title}</SectionLabel>
      <p className="bt-sub" style={{ margin: '6px 0 12px' }}>
        {subtitle}
      </p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`bt-seg${disabled ? ' bt-seg--off' : ''}`} role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          disabled={disabled}
          className={`bt-seg__opt${value === opt.id ? ' bt-seg__opt--on' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
