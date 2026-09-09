import type { ReactNode } from 'react';
import { Card, SectionLabel } from './ui/primitives';
import { SlidersIcon } from './ui/icons';
import type { AudioWhere } from './useAudioSettings';
import { defaultPlayStyle, isClassic } from './playStyle';
import {
  CLIP_MAX,
  CLIP_MIN,
  CLIP_START_ENABLED,
  CLIP_STEP,
  PICK_MAX,
  PICK_MIN,
  PICK_STEP,
  PREVIEW_SECONDS,
  clipLabel,
  maxClipStart,
} from './rules';
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

export function rulesSummary(
  room: BattleRoom,
  aiJudge: boolean,
  clipSeconds?: number,
  pickSeconds?: number
): string {
  const format = room.format === 'bracket' ? 'Bracket' : 'Best of 3';
  const style = isClassic(room) ? 'Classic' : 'TuneBoxed';
  const judging = aiJudge ? 'AI judge' : VOTING[resolvedVoting(room)].title;
  const clip = clipSeconds ? ` · ${clipSeconds}s clips` : '';
  const pick =
    !isClassic(room) && pickSeconds !== undefined
      ? pickSeconds > 0
        ? ` · ${pickSeconds}s to pick`
        : ' · no pick clock'
      : '';
  return `${format} · ${style} · ${judging}${clip}${pick}`;
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
  clipSeconds,
  clipStart,
  onClipSeconds,
  onClipStart,
  pickSeconds,
  onPickSeconds,
  audio,
  onEndBattle,
  onChange,
}: {
  room: BattleRoom;
  playerCount: number;
  aiJudge: boolean;
  clipSeconds: number;
  clipStart: number;
  onClipSeconds: (seconds: number) => void;
  onClipStart: (startSeconds: number) => void;
  pickSeconds: number;
  onPickSeconds: (seconds: number) => void;
  audio: {
    volume: number;
    onVolume: (v: number) => void;
    autoLevel: boolean;
    onAutoLevel: (on: boolean) => void;
    where: AudioWhere;
    onWhere: (where: AudioWhere) => void;
  };
  onEndBattle?: () => void;
  onChange: (patch: Patch) => void;
}) {
  const isBracket = room.format === 'bracket';
  const inLobby = room.status === 'lobby';
  const classic = isClassic(room);
  const voting = resolvedVoting(room);
  const votingOptions: BattleVotingMode[] = isBracket ? ['host', 'everyone'] : ['judge', 'host', 'everyone'];
  const hostOnly = room.host_speaker_enabled === true;
  // Guarded here as well as in the hook, so a stored pair that no longer fits
  // cannot render a thumb past the end of its own track.
  const startCeiling = maxClipStart(clipSeconds);
  const startPoint = Math.min(clipStart, startCeiling);
  const volumePct = Math.round(audio.volume * 100);

  return (
    <Card className="bt-settings-panel">
      <SectionLabel>Game settings</SectionLabel>

      <SettingsBlock
        title="Who hears the songs"
        subtitle={
          hostOnly
            ? 'Only your browser plays audio. Capture that tab, or the board if you send sound there below.'
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
        title="Sound comes from"
        subtitle={
          audio.where === 'board'
            ? 'The stream board tab plays the songs. Capture that tab and the stream hears them.'
            : 'This room tab plays the songs. If you capture the board instead, the stream stays silent.'
        }
      >
        <Segmented
          value={audio.where}
          options={[
            { id: 'room', label: 'This tab' },
            { id: 'board', label: 'Stream board' },
          ]}
          onChange={(id) => audio.onWhere(id)}
        />
      </SettingsBlock>

      <SettingsBlock
        title="Volume"
        subtitle={
          audio.autoLevel
            ? 'Master level for this browser. Songs are also levelled so a quiet track is not buried by a loud one.'
            : 'Master level for this browser. Turn levelling on if one song is much louder than the next.'
        }
      >
        <input
          className="bt-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={volumePct}
          aria-label="Master volume"
          onChange={(e) => audio.onVolume(Number(e.currentTarget.value) / 100)}
        />
        <div className="bt-slider__scale" aria-hidden="true">
          <span>Mute</span>
          <strong className="bt-slider__now">{volumePct}%</strong>
          <span>Full</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <Segmented
            value={audio.autoLevel ? 'on' : 'off'}
            options={[
              { id: 'on', label: 'Level songs' },
              { id: 'off', label: 'As mastered' },
            ]}
            onChange={(id) => audio.onAutoLevel(id === 'on')}
          />
        </div>
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
              : `A fresh random vibe each round. Players have ${
                  pickSeconds > 0 ? `${pickSeconds} seconds` : 'no clock'
                } to pick once the round is live.`
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

      {!classic && (
        <SettingsBlock
          title="Time to pick a song"
          subtitle={
            `${pickSeconds} seconds to find a song. Takes effect from the next round.`
          }
        >
          <input
            className="bt-slider"
            type="range"
            min={PICK_MIN}
            max={PICK_MAX}
            step={PICK_STEP}
            value={pickSeconds > 0 ? pickSeconds : PICK_MIN}
            aria-label="Seconds to pick a song"
            onChange={(e) => onPickSeconds(Number(e.currentTarget.value))}
          />
          <div className="bt-slider__scale" aria-hidden="true">
            <span>{PICK_MIN}s</span>
            <strong className="bt-slider__now">{pickSeconds > 0 ? `${pickSeconds}s` : `${PICK_MIN}s`}</strong>
            <span>{PICK_MAX}s</span>
          </div>
        </SettingsBlock>
      )}

      {/* Available mid-game: the right length is something a host works out
          while running the room, and a party with eight picks wants a shorter
          clip than a head-to-head. */}
      <SettingsBlock
        title="How long each song plays"
        subtitle={`Each song plays for ${clipLabel(
          clipSeconds
        )}. Takes effect from the next play, so it will not cut a song that is already going.`}
      >
        <input
          className="bt-slider"
          type="range"
          min={CLIP_MIN}
          max={CLIP_MAX}
          step={CLIP_STEP}
          value={clipSeconds}
          aria-label="Seconds each song plays for"
          onChange={(e) => onClipSeconds(Number(e.currentTarget.value))}
        />
        <div className="bt-slider__scale" aria-hidden="true">
          <span>{CLIP_MIN}s</span>
          <strong className="bt-slider__now">{clipSeconds}s</strong>
          <span>{CLIP_MAX}s</span>
        </div>
      </SettingsBlock>

      {/* The clip has to finish inside the thirty second preview, so the room
          to move the start is whatever the length is not using. At the full
          length there is none, and the slider says so rather than
          disappearing. */}
      {CLIP_START_ENABLED && (
        <SettingsBlock
          title="Where each song starts"
          subtitle={
            startCeiling === 0
              ? `A ${clipSeconds} second clip uses the whole preview, so it has to start at the beginning. Shorten it to skip the intro.`
              : startPoint === 0
                ? 'Clips play from the start of the preview. Drag to skip an intro and land on the chorus.'
                : `Clips skip the first ${startPoint} seconds.`
          }
        >
          <input
            className="bt-slider"
            type="range"
            min={0}
            max={startCeiling}
            step={CLIP_STEP}
            value={startPoint}
            disabled={startCeiling === 0}
            aria-label="Seconds to skip before each clip starts"
            onChange={(e) => onClipStart(Number(e.currentTarget.value))}
          />
          <div className="bt-slider__scale" aria-hidden="true">
            <span>0s</span>
            <strong className="bt-slider__now">
              {startPoint}s&ndash;{startPoint + clipSeconds}s
            </strong>
            <span>{PREVIEW_SECONDS}s</span>
          </div>
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

      {onEndBattle && room.status !== 'complete' && room.status !== 'lobby' && (
        <SettingsBlock
          title="End this battle"
          subtitle="Stops the room for everyone. The board goes quiet and nobody gets pulled back into it later."
        >
          <button type="button" className="bt-end" onClick={onEndBattle}>
            End battle
          </button>
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
