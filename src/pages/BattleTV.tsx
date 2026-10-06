import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import { useBattleRound } from '../battle/useBattleRound';
import { useRoundAutopilot } from '../battle/useRoundAutopilot';
import { useSyncedPlayback } from '../battle/useSyncedPlayback';
import { useUsedGenres } from '../battle/useUsedGenres';
import { secondsUntil, syncClock } from '../battle/clock';
import { useClipSeconds } from '../battle/useClipSeconds';
import { usePickSeconds } from '../battle/usePickSeconds';
import { useAudioSettings } from '../battle/useAudioSettings';
import { BRACKET_CAP, PARTY_ROUNDS } from '../battle/rules';
import { type HostContext, nextHostAction } from '../battle/hostActions';
import { resolvedVoting } from '../battle/GameSettings';
import {
  bracketEntrants,
  classicReady,
  hasEntry,
  hostJudges,
  isClassic,
  ownerId,
  songsPerPlayer,
} from '../battle/playStyle';
import GenreScene from '../battle/GenreScene';
import EmbedPlayer from '../battle/EmbedPlayer';
import StartPointSlider from '../battle/StartPointSlider';
import { embedSourceOf, embedStart } from '../battle/embeds';
import { uniqueLeader } from '../battle/voteLeader';
import { BoxerSprite, Gloves, Monogram, PromptLabel } from '../battle/ui/primitives';
import BoxingMatch from '../battle/ui/BoxingMatch';
import { bracketFighters, loadoutFromPlayer, pairFighters, spectators } from '../battle/bout';
import DemoChat, { type ChatLine } from '../battle/ui/DemoChat';
import { useChatFeed } from '../battle/useChatFeed';
import FightCanvas from '../fight3d/FightCanvas';
import LockerRoom from '../fight3d/LockerRoom';
import { CheckIcon, CrownIcon, TrophyIcon } from '../battle/ui/icons';
import type { BattleMatch, BattlePlayer, BattleRoundPhase, BattleSubmission } from '../types/battle';
import '../battle/ui/ui.css';
import './tv.css';

/**
 * The board an audience watches, and the web counterpart to BattleTVView on an
 * AirPlay screen.
 *
 * This replaces the transparent OBS overlay. A transparent strip only works
 * for people who already run broadcasting software and already have a scene to
 * put it over, and it looked nothing like the game. An opaque board can simply
 * be shared as a browser tab, which works on every platform and needs nothing
 * installed, and it still drops into a Browser Source for anyone who wants
 * that.
 *
 * A host who opens it in their own browser also gets the controls, because
 * they have a session for this room in that browser. Anyone else, including an
 * OBS Browser Source with its own empty storage, gets exactly what it always
 * was: a screen that reads the room and can write nothing to it.
 */
export default function BattleTV() {
  const { code = '' } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const demo = params.get('demo') === '1';
  // For a host who captures this tab directly rather than through a Browser
  // Source, where their own controls would otherwise go out on the stream.
  const controlsAllowed = params.get('controls') !== '0';

  const stored = useMemo(() => {
    if (demo) return null;
    battle.takeHandoff(code);
    return battle.loadSession(code);
  }, [code, demo]);
  const token = stored?.token ?? null;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Loads on its own rather than through the room page, so it syncs its own
  // clock or every countdown would run against the local one.
  useEffect(() => {
    void syncClock();
  }, []);

  // The marketing site paints the page white and constrains it; a board is a
  // full-bleed surface. Scoped to a class on the document so the rule cannot
  // leak into the rest of the bundle.
  useEffect(() => {
    document.documentElement.classList.add('tv-active');
    return () => document.documentElement.classList.remove('tv-active');
  }, []);

  // Keeps the countdown moving. An interval rather than animation frames,
  // because a browser source renders offscreen where frames are throttled.
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!code || demo) return;
    let live = true;
    battle
      .getRoomByCode(code)
      .then((r) => {
        if (!live) return;
        if (r) setRoomId(r.id);
        else setMissing(true);
      })
      .catch(() => live && setMissing(true));
    return () => {
      live = false;
    };
  }, [code, demo]);

  const liveRoom = useBattleRoom(roomId, token);
  const liveRound = useBattleRound(liveRoom.room);

  // ?demo=1 renders a sample battle. Sizing and positioning a board has to
  // happen before going live, and an empty lobby gives nobody anything to aim
  // at. Judging with chat votes is the busiest the board ever gets, so that is
  // the state worth checking against.
  const sample = useMemo(
    () => (demo ? demoState(params.get('phase'), params.get('genre')) : null),
    [demo, params]
  );
  const demoBoard = useDemoBout(sample, params.get('phase'));
  // The demo only lists people, so it doubles as its own entrants.
  const { room, players, entrants = players, matches } = demoBoard ?? sample ?? liveRoom;
  const { round, submissions, votes } = demoBoard ?? sample ?? liveRound;

  // ?chat=1 shows the host's linked channel, ?chat=name any channel. It rides
  // on the URL so an OBS Browser Source gets it as well as a captured tab.
  const chatParam = params.get('chat');
  const chatChannel =
    chatParam === null || chatParam === '0'
      ? null
      : chatParam === '1' || chatParam === ''
        ? room?.host_twitch_login ?? null
        : TWITCH_LOGIN.test(chatParam)
          ? chatParam.toLowerCase()
          : null;
  // The demo room's channel is made up, so ?demo=1&chat=1 shows sample lines.
  // Naming a real channel previews the layout with that chat.
  const sampleChat = demo && (chatParam === '1' || chatParam === '');
  const chatFeed = useChatFeed(sampleChat ? null : chatChannel);
  const chatPanel = chatChannel ? (
    <DemoChat
      variant="board"
      channel={chatChannel}
      lines={sampleChat ? DEMO_CHAT_LINES : chatFeed.lines}
      status={chatFeed.connected ? 'Welcome to the chat room!' : `Connecting to #${chatChannel}…`}
    />
  ) : null;

  const isHost = Boolean(room && stored && room.host_player_id === stored.playerId);
  const usedGenres = useUsedGenres(roomId, round?.id ?? null);

  const pick = usePickSeconds();
  const audio = useAudioSettings(submissions);
  const hearBoard = audio.where === 'board';
  // The host chooses which tab sounds. A streamer captures this board, so
  // when they send audio here the stream hears the songs. The other tab
  // stays quiet so the two do not play half a second apart.
  const playback = useSyncedPlayback(round, submissions, hearBoard && round?.phase === 'playing', undefined, {
    volume: audio.volume,
    gainFor: audio.gainFor,
    sinkId: audio.sinkId,
  });

  // Same preference the room page reads, since a host can drive the game from
  // either tab and both have to agree on how long a song plays for.
  const clip = useClipSeconds();

  // The host drives the game from whichever tab they are looking at, so the
  // parts of a round that run themselves have to run here too.
  const { empty: pickedNothing } = useRoundAutopilot({
    token,
    isHost,
    round,
    submissions,
    playbackFinished: playback.finished,
    clipSeconds: clip.seconds,
    clipStart: clip.start,
  });

  const pointerActive = usePointerActivity();
  // YouTube and SoundCloud picks play in the provider's player, which has to
  // be on the page to sound at all. The board used to leave them out, so a
  // streamer sending sound to the board heard nothing on a pasted link.
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const liveEmbed =
    hearBoard && round?.phase === 'playing' && embedSourceOf(playback.current)
      ? playback.current
      : null;
  const startArmedAt = useRef(0);
  const lastTheme = useRef<string | null | undefined>(undefined);

  if (missing) {
    return (
      <Board genre={null}>
        <div className="tv-idle">
          <Gloves size={220} />
          <h1 className="tv-idle__title">No room with that code</h1>
        </div>
      </Board>
    );
  }

  if (!room) {
    return (
      <Board genre={null}>
        <div className="tv-idle">
          <Gloves size={220} />
          <h1 className="tv-idle__title">Connecting…</h1>
        </div>
      </Board>
    );
  }

  const nameOf = (id: string | null) =>
    entrants.find((p) => p.id === id)?.display_name ?? 'Player';
  const ownerOf = (id: string | null | undefined) => {
    const row = id ? entrants.find((p) => p.id === id) : undefined;
    return row ? ownerId(row) : id ?? null;
  };

  const isBracket = room.format === 'bracket';
  const classic = isClassic(room);
  const judging = hostJudges(room);
  const currentMatch = matches.find((m) => m.id === room.current_match_id) ?? null;
  const connected = players.filter((p) => p.is_connected);

  const championId =
    matches.find((m) => m.next_match_id === null && m.winner_player_id)?.winner_player_id ?? null;

  // Chat decides in a room tied to a Twitch channel. The board is never the
  // client reading chat, so it shows whatever the host last published. A
  // judging host makes the call themselves, so chat does not.
  const chatTally = room.host_twitch_login && !judging ? round?.chat_tally ?? {} : null;

  const isCompetitor = (p: BattlePlayer) =>
    Boolean(
      currentMatch &&
        (ownerOf(currentMatch.player_a_id) === p.id || ownerOf(currentMatch.player_b_id) === p.id)
    );

  const needsAiJudge =
    isBracket && !chatTally && connected.length > 0 && connected.every(isCompetitor);

  // Whoever is making the call this round can make it from the board, so a
  // streamer judging on stream never has to leave the captured tab. A host's
  // tap crowns straight away; a rotating judge's tap is their vote, which the
  // host then reveals.
  const voting = resolvedVoting(room);
  const deciderId = chatTally
    ? null
    : judging || voting === 'host'
      ? room.host_player_id
      : voting === 'judge'
        ? round?.judge_player_id ?? null
        : null;
  const canCrown = Boolean(
    token && stored && round?.phase === 'judging' && deciderId && deciderId === stored.playerId
  );
  const me = players.find((p) => p.id === stored?.playerId) ?? null;
  // "Everyone votes": anyone with a seat can vote from the board too, except
  // the two in a bracket matchup.
  const roomVoter = Boolean(
    token &&
      me &&
      round?.phase === 'judging' &&
      !chatTally &&
      !judging &&
      !needsAiJudge &&
      voting === 'everyone' &&
      !(isBracket && isCompetitor(me))
  );
  const crown = (submissionId: string) => {
    if (!token || !round) return;
    const sub = submissions.find((s) => s.id === submissionId);
    if (roomVoter && !canCrown && me && sub && ownerOf(sub.player_id) === me.id) {
      setActionError('You cannot vote for your own song.');
      return;
    }
    setActionError(null);
    setBusy(true);
    battle
      .castVote(token, round.id, submissionId)
      .then(() => (isHost && canCrown ? battle.setRoundWinner(token, round.id, submissionId) : undefined))
      .catch((e: Error) => setActionError(e.message))
      .finally(() => setBusy(false));
  };
  const myVote = votes.find((v) => v.voter_player_id === stored?.playerId) ?? null;
  const pickOpen = (canCrown && !(myVote && !isHost)) || (roomVoter && !myVote);

  const ballotCounts: Record<string, number> = {};
  for (const s of submissions) {
    ballotCounts[s.id] = chatTally
      ? chatTally[s.id] ?? 0
      : votes.filter((v) => v.submission_id === s.id).length;
  }
  const voteLeader = uniqueLeader(ballotCounts);

  const hostCtx: HostContext | null =
    token && isHost
      ? {
          token,
          room,
          matches,
          round,
          submissions,
          voteLeader,
          usedGenres,
          clipSeconds: clip.seconds,
          clipStart: clip.start,
          pickSeconds: pick.seconds,
          refresh: liveRoom.refresh,
        }
      : null;

  const action = hostCtx
    ? nextHostAction(hostCtx, {
        ready: classic
          ? classicReady(room, entrants)
          : connected.filter((p) => !judging || p.id !== room.host_player_id).length >= room.min_players,
        needsAiJudge,
        empty: pickedNothing,
        finished: championId !== null,
      })
    : null;

  if (room.theme !== lastTheme.current) {
    if (room.theme?.trim()) startArmedAt.current = Date.now() + 1200;
    lastTheme.current = room.theme;
  }

  const controls =
    (isHost || canCrown || roomVoter) && controlsAllowed ? (
      <HostBar
        action={action}
        busy={busy}
        error={actionError}
        hearBlocked={hearBoard && (playback.blocked || embedBlocked)}
        onUnblock={() => {
          playback.unblock();
          setEmbedBlocked(false);
        }}
        crownChoices={
          (canCrown && !(myVote && !isHost)) || (roomVoter && !isHost && !myVote)
            ? submissions
                .filter((s) => canCrown || !me || ownerOf(s.player_id) !== me.id)
                .map((s) => ({
                  id: s.id,
                  label: s.song_title,
                  onCrown: () => crown(s.id),
                }))
            : null
        }
        waiting={
          (canCrown || roomVoter) && myVote && !isHost
            ? `You ${canCrown ? 'crowned' : 'voted for'} ${submissions.find((s) => s.id === myVote.submission_id)?.song_title ?? 'a song'}. ${nameOf(room.host_player_id)} reveals it.`
            : null
        }
        startSlider={
          token && round?.phase === 'playing' && embedSourceOf(playback.current) ? (
            <StartPointSlider
              token={token}
              submission={playback.current!}
              duration={durations[playback.current!.id] ?? null}
              className="tv-controls__slider"
              labelClassName="tv-controls__hint"
            />
          ) : null
        }
        visible={
          pointerActive || Boolean(actionError) || (hearBoard && (playback.blocked || embedBlocked))
        }
        onRun={() => {
          if (!action) return;
          if (action.id === 'start' && Date.now() < startArmedAt.current) return;
          if (action.id === 'start' || action.id === 'play') playback.prime();
          setActionError(null);
          setBusy(true);
          action
            .run()
            .catch((e: Error) => setActionError(e.message))
            .finally(() => setBusy(false));
        }}
      />
    ) : null;

  if (championId) {
    return (
      <Board genre={round?.genre ?? null} controls={controls} chat={chatPanel}>
        <div className="tv-champion tv-hero">
          <span className="tv-champion__trophy">
            <TrophyIcon size={96} />
          </span>
          <PromptLabel>Champion</PromptLabel>
          <h1 className="tv-champion__name">{nameOf(championId)}</h1>
          <p className="tv-champion__sub">Winner of the whole bracket</p>
        </div>
      </Board>
    );
  }

  if (!round) {
    if (demo && params.get('phase') === 'locker') {
      return (
        <Board genre={null}>
          <div className="tv-locker">
            <LockerRoom name="Ashley" seed={null} onChange={() => undefined} />
          </div>
        </Board>
      );
    }
    return (
      <Board
        genre={classic ? room.theme : null}
        host={room.host_twitch_login}
        avatar={room.host_avatar_url}
        controls={controls}
        chat={chatPanel}
      >
        <Lobby
          code={room.code}
          players={players}
          songs={bracketEntrants(room, entrants).filter(hasEntry)}
          max={songsPerPlayer(room) > 1 ? BRACKET_CAP : room.max_players}
          theme={classic ? room.theme : null}
          judgeId={judging ? room.host_player_id : null}
        />
      </Board>
    );
  }

  const seconds = round.phase_deadline_at ? secondsUntil(round.phase_deadline_at) : null;

  // A two-song bout is fought rather than polled. Bracket corners follow the
  // match; Classic party uses submission order when exactly two songs are in.
  const fight = isBracket
    ? bracketFighters(currentMatch, submissions, ballotCounts, players, nameOf)
    : pairFighters(submissions, ballotCounts, players, nameOf);

  const decidedBy =
    submissions.find((s) => s.id === round.winner_submission_id)?.player_id ??
    currentMatch?.winner_player_id ??
    null;
  const demoNowPlaying = (round as { demo_now_playing?: 'a' | 'b' | null }).demo_now_playing ?? null;
  // The looping demo squeezes each walkout; a frozen ?phase=walkout runs a full preview.
  const demoWalkTick = (round as { demo_walk_tick?: number }).demo_walk_tick;
  const demoFight = (round as { demo_fight?: string }).demo_fight;
  const demoLoop = demoNowPlaying && demoWalkTick !== undefined ? { demo_walk_tick: demoWalkTick } : null;
  const seatOf = (playerId: string | null | undefined): 'a' | 'b' | null => {
    if (!playerId) return null;
    if (currentMatch) {
      if (playerId === currentMatch.player_a_id) return 'a';
      if (playerId === currentMatch.player_b_id) return 'b';
      return null;
    }
    if (submissions[0]?.player_id === playerId) return 'a';
    if (submissions[1]?.player_id === playerId) return 'b';
    return null;
  };
  const bout = Boolean(fight && round.phase !== 'picking');

  return (
    <Board
      genre={round.genre}
      fight={bout}
      host={room.host_twitch_login}
      avatar={room.host_avatar_url}
      controls={controls}
      chat={chatPanel}
      embed={
        liveEmbed ? (
          <EmbedPlayer
            compact
            source={embedSourceOf(liveEmbed)!}
            externalId={liveEmbed.external_id ?? ''}
            offset={embedStart(liveEmbed) + playback.offset}
            playing
            volume={audio.volume * audio.gainFor(liveEmbed)}
            onBlocked={setEmbedBlocked}
            onDuration={(d) =>
              setDurations((prev) => (prev[liveEmbed.id] === d ? prev : { ...prev, [liveEmbed.id]: d }))
            }
          />
        ) : null
      }
    >
      <div className="tv-live">
        <header className="tv-head">
          <div className="tv-head__bar">
            <span className="tv-head__cell">
              <span className="tv-eyebrow">Room code</span>
              <span className="tv-code">{room.code}</span>
            </span>

            {bout && (
              <div className="tv-prompt-inline">
                <PromptLabel>{classic ? "This game's vibe" : 'Genre prompt'}</PromptLabel>
                <h1 className="tv-genre" data-len={lengthClass(round.genre)}>
                  {round.genre}
                </h1>
              </div>
            )}
            <span className="tv-head__right">
              {bout && room.host_twitch_login && (
                <span className="tv-head__cell tv-head__host">
                  {room.host_avatar_url && <img className="tv-host__avatar" src={room.host_avatar_url} alt="" />}
                  <span>{room.host_twitch_login}</span>
                </span>
              )}
              {seconds !== null ? (
                <span className={`tv-timer${seconds <= 10 ? ' tv-timer--urgent' : ''}`}>
                  {seconds}
                </span>
              ) : (
                // The fight carries its own round pill between the health bars,
                // so the header only owns this when there is no bout on screen.
                !fight && (
                  <span className="tv-round">
                    {isBracket
                      ? `Round ${room.round_number}`
                      : `Round ${room.round_number} of ${PARTY_ROUNDS}`}
                  </span>
                )
              )}
            </span>
          </div>
        </header>

        {/* Compact once there is a bout on screen. The prompt is the headline
            of a lobby, but during a fight it is context and the ring is the
            thing people are watching. */}
        {!bout && (
          <div className={`tv-hero${fight ? ' tv-hero--compact' : ''}`}>
            <PromptLabel>{classic ? "This game's vibe" : 'Genre prompt'}</PromptLabel>
            <h1 className="tv-genre" data-len={lengthClass(round.genre)}>
              {round.genre}
            </h1>
            {!fight && (
              <p className="tv-hero__sub">
                {phaseLine(round.phase, seconds, room.host_twitch_login)}
              </p>
            )}
          </div>
        )}

        {bout && fight ? (
          <BoxingMatch
            a={fight.a}
            b={fight.b}
            phase={round.phase}
            winner={seatOf(decidedBy)}
            nowPlaying={
              round.phase === 'playing' ? (demoNowPlaying ?? seatOf(playback.current?.player_id)) : null
            }
            walkSeconds={demoLoop ? (DEMO_WALK_TICKS * 700) / 1000 : playback.perSong}
            walkOffset={demoLoop ? (demoLoop.demo_walk_tick ?? 0) * 0.7 : playback.offset}
            fightKey={demoFight ?? round.id}
            chatChannel={room.host_twitch_login}
            roundLabel={isBracket ? `Round ${room.round_number}` : `Round ${room.round_number} of ${PARTY_ROUNDS}`}
            fans={spectators(players, fight.a.name, fight.b.name)}
            judgeName={
              deciderId
                ? deciderId === room.host_player_id
                  ? room.host_twitch_login ?? nameOf(deciderId)
                  : nameOf(deciderId)
                : null
            }
            onPick={
              pickOpen && !busy
                ? (side) => {
                    const pick = side === 'a' ? fight.a : fight.b;
                    const sub = submissions.find(
                      (s) => s.song_title === pick.songTitle && nameOf(s.player_id) === pick.name
                    ) ?? submissions[side === 'a' ? 0 : 1];
                    if (sub) crown(sub.id);
                  }
                : undefined
            }
          />
        ) : (
          <>
            {currentMatch && (
              <Matchup match={currentMatch} nameOf={nameOf} winnerId={decidedBy} />
            )}

            {round.phase === 'picking' && (
              <Picking players={entrants} match={currentMatch} submissions={submissions} />
            )}

            {round.phase === 'playing' && (
              <Playing
                now={playback.current}
                total={playback.total}
                index={playback.index}
                nameOf={nameOf}
              />
            )}

            {round.phase === 'judging' && (
              <Ballot
                submissions={submissions}
                counts={ballotCounts}
                chatChannel={room.host_twitch_login}
                onCrown={pickOpen && !busy ? crown : undefined}
              />
            )}

            {round.phase === 'revealed' && (
              <Revealed
                winner={submissions.find((s) => s.id === round.winner_submission_id) ?? null}
                nameOf={nameOf}
              />
            )}
          </>
        )}
      </div>
    </Board>
  );
}

// ---------------------------------------------------------------

/**
 * Stand-in battle for ?demo=1.
 *
 * Only the fields this view reads are filled in, and the assertion is what
 * keeps the sample small: spelling out every column of five tables would mean
 * updating a fake row every time the schema moves.
 */
const DEMO = {
  room: {
    id: 'demo',
    code: 'DEMO1',
    status: 'in_round',
    format: 'bracket',
    min_players: 2,
    max_players: 16,
    round_number: 1,
    current_match_id: 'm1',
    host_player_id: null,
    host_twitch_login: 'yourchannel',
    host_avatar_url: null,
  },
  players: [
    { id: '1', display_name: 'Ashley', is_connected: true, avatar_seed: 'tb1.1.5.1.0.0.6.1.0' },
    { id: '2', display_name: 'Marcus', is_connected: true, avatar_seed: 'tb1.0.5.0.1.1.6.1.6' },
    { id: '3', display_name: 'Jules', is_connected: true },
    { id: '4', display_name: 'Sam', is_connected: true },
    { id: '5', display_name: 'Devon', is_connected: true },
    { id: '6', display_name: 'Priya', is_connected: true },
    { id: '7', display_name: 'Chris', is_connected: true },
    { id: '8', display_name: 'Nia', is_connected: true },
  ],
  matches: [
    {
      id: 'm1',
      bracket_round: 1,
      match_index: 0,
      player_a_id: '1',
      player_b_id: '2',
      winner_player_id: null,
      next_match_id: null,
      status: 'active',
    },
  ],
  round: {
    id: 'r1',
    phase: 'judging',
    genre: 'Feels Like Stranger Things',
    phase_deadline_at: null,
    winner_submission_id: null,
    chat_tally: { s1: 128, s2: 74 },
  },
  submissions: [
    {
      id: 's1',
      player_id: '1',
      song_title: 'Ms. Jackson',
      song_artist: 'Outkast',
      artwork_url:
        'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/d6/21/fb/d621fbde-c099-6794-7102-2692f10c4dbb/886448814283.jpg/100x100bb.jpg',
    },
    {
      id: 's2',
      player_id: '2',
      song_title: 'Hey Ya!',
      song_artist: 'Outkast',
      artwork_url:
        'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/71/ae/6a/71ae6a46-99a6-e9d8-d7f3-41c0f2df45c4/196872579123.jpg/100x100bb.jpg',
    },
  ],
  votes: [],
} as unknown as ReturnType<typeof useBattleRoom> & ReturnType<typeof useBattleRound>;

/** Twitch's own rule for a login, so a bad ?chat= never reaches the socket. */
const TWITCH_LOGIN = /^[a-z0-9_]{3,25}$/i;

/** What ?demo=1&chat=1 shows in the chat column, since there is no channel to read. */
const DEMO_CHAT_LINES: ChatLine[] = (
  [
  ['yourchannel', '#9147ff', ['broadcaster'], 'first fight of the night, get voting'],
  ['lofi_lena', '#4dabf7', ['subscriber'], 'Ms. Jackson walkout goes crazy'],
  ['ko_kaito', '#ff922b', [], '1'],
  ['hookqueen', '#da77f2', ['moderator', 'subscriber'], 'type 1 or 2 chat'],
  ['basshead99', '#69db7c', ['subscriber'], '2'],
  ['vinylvic', '#ffd43b', [], '1'],
  ['tempo_tay', '#ff6b6b', ['vip'], 'HEY YA ALL DAY'],
  ['grooveguru', '#3bc9db', ['premium'], '1'],
  ['snarekid', '#f783ac', [], 'COMBO!!'],
  ] as [string, string, NonNullable<ChatLine['badges']>, string][]
).map(([user, color, badges, text], i) => ({ key: `demo-${i}`, user, color, badges, text }));

/** Each demo walkout, in 700 ms ticks. Real rounds use the 30 s preview. */
const DEMO_WALK_TICKS = 12;

/** Scripted chat, one tick at a time: corner 2 lands a combo, then corner 1 runs off a huge one. */
const DEMO_CHAT: [number, number][] = [
  [0, 1], [0, 1], [1, 0], [0, 1], [0, 1], [0, 1],
  [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0],
  [0, 1], [1, 1], [2, 0], [1, 0], [0, 1], [1, 0], [1, 0], [1, 0],
];

/** Default ?demo=1 loops a bout: both walkouts, the punches, then the card. */
function useDemoBout(sample: typeof DEMO | null, freezePhase: string | null): typeof DEMO | null {
  const [tick, setTick] = useState(0);
  const live = Boolean(sample?.round) && freezePhase == null;
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 700);
    return () => window.clearInterval(t);
  }, [live]);
  if (!sample || !live) return sample;

  const introTicks = DEMO_WALK_TICKS * 2;
  const votingTicks = 20;
  const resultTicks = 13;
  const step = tick % (introTicks + votingTicks + resultTicks);
  const intro = step < introTicks;
  const voting = step >= introTicks && step < introTicks + votingTicks;
  const counted = intro ? 0 : Math.min(DEMO_CHAT.length, step - introTicks + 1);
  const tally = DEMO_CHAT.slice(0, counted).reduce(
    (t, [va, vb]) => ({ s1: t.s1 + va, s2: t.s2 + vb }),
    { s1: 0, s2: 0 }
  );
  return {
    ...sample,
    round: {
      ...sample.round,
      phase: intro ? 'playing' : voting ? 'judging' : 'revealed',
      demo_now_playing: intro ? (step < DEMO_WALK_TICKS ? 'a' : 'b') : null,
      demo_walk_tick: step % DEMO_WALK_TICKS,
      demo_fight: `demo-${Math.floor(tick / (introTicks + votingTicks + resultTicks))}`,
      chat_tally: tally,
      winner_submission_id: intro || voting ? null : 's1',
    },
  } as typeof DEMO;
}

/**
 * The sample board at any point of a round, via `?demo=1&phase=…`, so the
 * layout can be checked in a browser or an OBS source without a live room.
 * `&genre=` swaps the prompt, and with it the backdrop, and makes the room a
 * Classic one so the lobby shows the vibe card.
 */
function demoState(phase: string | null, genre: string | null): typeof DEMO {
  const base = genre
    ? ({
        ...DEMO,
        room: { ...DEMO.room, play_style: 'classic', theme: genre },
        round: { ...DEMO.round, genre },
      } as typeof DEMO)
    : DEMO;
  const at = (patch: Record<string, unknown>) =>
    ({
      ...base,
      ...patch,
      room: { ...base.room, ...((patch.room as object) ?? {}) },
    }) as typeof DEMO;
  switch (phase) {
    case 'locker':
    case 'lobby':
      return at({ room: { status: 'lobby', current_match_id: null }, round: null, submissions: [] });
    case 'picking':
      return at({ round: { ...base.round, phase: 'picking' }, submissions: [] });
    case 'playing':
      return at({ round: { ...base.round, phase: 'playing' } });
    case 'walkout':
    case 'walkout-b':
      return at({
        round: { ...base.round, phase: 'playing', demo_now_playing: phase === 'walkout-b' ? 'b' : 'a' },
      });
    case 'revealed':
      return at({ round: { ...base.round, phase: 'revealed', winner_submission_id: 's1' } });
    case 'ko':
      return at({
        round: { ...base.round, phase: 'revealed', winner_submission_id: 's1', chat_tally: { s1: 24, s2: 0 } },
      });
    case 'champion':
      return at({
        room: { status: 'complete', current_match_id: null },
        matches: [{ ...base.matches[0], status: 'complete', winner_player_id: '1' }],
      });
    default:
      return base;
  }
}

/**
 * Long prompts get a smaller type ramp rather than a clipped one. "Feels Like
 * Stranger Things" and "70's Rock" cannot share a size and both look right.
 */
function lengthClass(genre: string): 'short' | 'medium' | 'long' {
  if (genre.length <= 12) return 'short';
  if (genre.length <= 22) return 'medium';
  return 'long';
}

/**
 * Whether anyone is at the keyboard.
 *
 * The host controls ride on this, so they fade off a board that is being
 * captured and are one mouse twitch away on the one the host is driving.
 */
function usePointerActivity(idleMs = 2500): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let timer = window.setTimeout(() => setActive(false), idleMs);
    const wake = () => {
      setActive(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(false), idleMs);
    };
    window.addEventListener('pointermove', wake);
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [idleMs]);

  return active;
}

function phaseLine(
  phase: BattleRoundPhase,
  seconds: number | null,
  chatChannel: string | null
): string {
  switch (phase) {
    case 'picking':
      return seconds !== null ? `${seconds} seconds left to pick` : 'Pick the song that fits the vibe';
    case 'playing':
      return 'Songs are playing…';
    case 'judging':
      return chatChannel ? 'Chat is voting' : 'The room is voting';
    case 'revealed':
      return 'Winner of the round';
    default:
      return '';
  }
}

function Board({
  children,
  genre,
  host,
  avatar,
  controls,
  embed,
  chat,
  fight = false,
}: {
  children: React.ReactNode;
  genre: string | null;
  /** The channel's chat as a column down the right, when the host turned it on. */
  chat?: React.ReactNode;
  /** A bout is on screen: the stage gives the ring every pixel it can. */
  fight?: boolean;
  host?: string | null;
  avatar?: string | null;
  controls?: React.ReactNode;
  /** The provider player for a YouTube or SoundCloud pick, parked in a corner. */
  embed?: React.ReactNode;
}) {
  return (
    <div className={`tv${fight ? ' tv--fight' : ''}${chat ? ' tv--chat' : ''}`}>
      <GenreScene genre={genre} />
      {chat && <div className="tv-chat">{chat}</div>}

      {host && (
        <div className="tv-host">
          {avatar && <img className="tv-host__avatar" src={avatar} alt="" />}
          <span>{host}</span>
        </div>
      )}

      <div className="tv-stage">{children}</div>
      {embed && <div className="tv-embed">{embed}</div>}
      {controls}
    </div>
  );
}

/**
 * The host's controls, on the board itself.
 *
 * Running a stream off two tabs meant clicking back to the room for every
 * reveal, which put the game's own UI on camera for a second each time. The
 * one thing there is to press now sits under the board it belongs to, and
 * fades out whenever the mouse stops so a captured tab shows a clean screen.
 */
function HostBar({
  action,
  busy,
  error,
  visible,
  hearBlocked,
  onUnblock,
  onRun,
  startSlider,
  crownChoices,
  waiting,
}: {
  action: { label: string; disabled: boolean } | null;
  busy: boolean;
  error: string | null;
  visible: boolean;
  hearBlocked: boolean;
  onUnblock: () => void;
  onRun: () => void;
  /** Where the playing YouTube or SoundCloud song starts. */
  startSlider?: React.ReactNode;
  /** A judging host's verdict: one button per song, and a tap crowns it. */
  crownChoices?: { id: string; label: string; onCrown: () => void }[] | null;
  /** Shown in place of the buttons once a judge who is not the host has voted. */
  waiting?: string | null;
}) {
  return (
    <div className={`tv-controls${visible ? ' tv-controls--on' : ''}`}>
      {error && <span className="tv-controls__error">{error}</span>}

      {startSlider}

      {hearBlocked && (
        <button type="button" className="tv-controls__go" onClick={onUnblock}>
          Tap to hear the songs
        </button>
      )}

      {waiting ? (
        <span className="tv-controls__idle">{waiting}</span>
      ) : crownChoices ? (
        crownChoices.map((c) => (
          <button
            key={c.id}
            type="button"
            className="tv-controls__go tv-controls__crown"
            disabled={busy}
            onClick={c.onCrown}
          >
            Crown {c.label}
          </button>
        ))
      ) : action ? (
        <button
          type="button"
          className="tv-controls__go"
          disabled={busy || action.disabled}
          onClick={onRun}
        >
          {busy ? 'Working…' : action.label}
        </button>
      ) : (
        !hearBlocked && <span className="tv-controls__idle">Nothing to press yet</span>
      )}

      <span className="tv-controls__hint">Only you can see this</span>
    </div>
  );
}

function Lobby({
  code,
  players,
  songs,
  max,
  theme,
  judgeId,
}: {
  code: string;
  players: BattlePlayer[];
  /** Every song going into the bracket, extra songs included. */
  songs: BattlePlayer[];
  max: number;
  theme: string | null;
  judgeId: string | null;
}) {
  const songsBy = (p: BattlePlayer) => songs.filter((s) => ownerId(s) === p.id).length;

  return (
    <div className="tv-lobby">
      <FightCanvas
        mode="parade"
        parade={players
          .filter((p) => !p.owner_player_id)
          .map((p) => ({
            name: p.display_name,
            loadout: loadoutFromPlayer(p),
            pose: 'idle' as const,
          }))}
      />
      <span className="tv-eyebrow">Join at tuneboxed.com</span>
      <div className="tv-lobby__code">{code}</div>
      {theme ? (
        <div className="tv-hero">
          <PromptLabel>This game&rsquo;s vibe</PromptLabel>
          <h1 className="tv-genre" data-len={lengthClass(theme)}>
            {theme}
          </h1>
        </div>
      ) : null}
      <p className="tv-lobby__sub">
        {theme
          ? `${songs.length} of ${max} songs in`
          : `${players.length} of ${max} in the room`}
      </p>

      <div className="tv-chips">
        {players.map((p) => {
          const n = songsBy(p);
          return (
            <span key={p.id} className={`tv-chip${n > 0 ? ' tv-chip--on' : ''}`}>
              <Monogram name={p.display_name} size={28} />
              {p.display_name}
              {p.id === judgeId
                ? ' · judging'
                : n > 1
                  ? ` · ${n} songs`
                  : n === 1
                    ? ' · locked in'
                    : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Matchup({
  match,
  nameOf,
  winnerId,
}: {
  match: BattleMatch;
  nameOf: (id: string | null) => string;
  winnerId: string | null | undefined;
}) {
  return (
    <div className="tv-matchup tv-card">
      <Corner
        side="blue"
        name={nameOf(match.player_a_id)}
        won={Boolean(winnerId) && winnerId === match.player_a_id}
        lost={Boolean(winnerId) && winnerId !== match.player_a_id}
      />
      <span className="tv-vs">VS</span>
      <Corner
        side="orange"
        name={nameOf(match.player_b_id)}
        won={Boolean(winnerId) && winnerId === match.player_b_id}
        lost={Boolean(winnerId) && winnerId !== match.player_b_id}
      />
    </div>
  );
}

function Corner({
  side,
  name,
  won,
  lost,
}: {
  side: 'blue' | 'orange';
  name: string;
  won: boolean;
  lost: boolean;
}) {
  return (
    <div className={`tv-corner${won ? ' tv-corner--won' : ''}`}>
      {won && (
        <span className="tv-corner__crown">
          <CrownIcon size={40} />
        </span>
      )}
      <BoxerSprite side={side} size={96} dimmed={lost} />
      <span className="tv-corner__name">{name}</span>
    </div>
  );
}

/**
 * Who still has to pick. Titles are deliberately absent: this is on a stream,
 * and showing a pick before it plays hands the room the answer early.
 */
function Picking({
  players,
  match,
  submissions,
}: {
  players: BattlePlayer[];
  match: BattleMatch | null;
  submissions: BattleSubmission[];
}) {
  const inMatch = match
    ? players.filter((p) => p.id === match.player_a_id || p.id === match.player_b_id)
    : players;
  const locked = new Set(submissions.map((s) => s.player_id));

  return (
    <div className="tv-status">
      {inMatch.map((p) => (
        <span key={p.id} className={`tv-pill${locked.has(p.id) ? ' tv-pill--on' : ''}`}>
          {locked.has(p.id) && <CheckIcon size={22} />}
          {p.display_name} {locked.has(p.id) ? 'locked in' : 'is picking'}
        </span>
      ))}
    </div>
  );
}

/**
 * The track that is sounding right now. Naming it is safe here and useful:
 * the room can already hear it, and a viewer who just tuned in cannot.
 */
function Playing({
  now,
  index,
  total,
  nameOf,
}: {
  now: BattleSubmission | null;
  index: number;
  total: number;
  nameOf: (id: string | null) => string;
}) {
  if (!now) {
    return (
      <div className="tv-status">
        <span className="tv-pill tv-pill--wide">Getting the first track ready…</span>
      </div>
    );
  }

  return (
    <div className="tv-now tv-card">
      {now.artwork_url && <img className="tv-now__art" src={now.artwork_url} alt="" />}
      <div className="tv-now__text">
        <span className="tv-eyebrow">
          Now playing · {Math.min(index + 1, total)} of {total}
        </span>
        <strong className="tv-now__title">{now.song_title}</strong>
        <span className="tv-now__artist">{now.song_artist}</span>
        <span className="tv-now__by">Picked by {nameOf(now.player_id)}</span>
      </div>
    </div>
  );
}

/**
 * The ballot chat votes against.
 *
 * Titles appear here even though picking hides them, because by now everyone
 * has heard both songs and nobody can choose between two bare numbers.
 */
function Ballot({
  submissions,
  counts,
  chatChannel,
  onCrown,
}: {
  submissions: BattleSubmission[];
  counts: Record<string, number>;
  chatChannel: string | null;
  /** Set for whoever is judging, and turns each row into their verdict. */
  onCrown?: (submissionId: string) => void;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="tv-ballot">
      {submissions.map((s, i) => {
        const count = counts[s.id] ?? 0;
        const share = total > 0 ? (count / total) * 100 : 0;
        const body = (
          <>
            <div className="tv-option__bar" style={{ width: `${share}%` }} />
            <span className="tv-option__num">{i + 1}</span>
            <span className="tv-option__text">
              <strong>{s.song_title}</strong>
              <span>{s.song_artist}</span>
            </span>
            {onCrown ? (
              <span className="tv-option__crown">
                <CrownIcon size={18} />
                Crown
              </span>
            ) : (
              <span className="tv-option__count">{count}</span>
            )}
          </>
        );
        return onCrown ? (
          <button
            key={s.id}
            type="button"
            className="tv-option tv-option--crown"
            onClick={() => onCrown(s.id)}
          >
            {body}
          </button>
        ) : (
          <div key={s.id} className="tv-option">
            {body}
          </div>
        );
      })}

      <p className="tv-foot">
        {chatChannel ? (
          <>
            Type <strong>1</strong> or <strong>2</strong> in chat · {total}{' '}
            {total === 1 ? 'vote' : 'votes'}
          </>
        ) : (
          <>
            {total} {total === 1 ? 'vote' : 'votes'} in
          </>
        )}
      </p>
    </div>
  );
}

function Revealed({
  winner,
  nameOf,
}: {
  winner: BattleSubmission | null;
  nameOf: (id: string | null) => string;
}) {
  if (!winner) return <div className="tv-status">No winner recorded</div>;

  return (
    <div className="tv-reveal tv-hero">
      <span className="tv-eyebrow">Takes the round</span>
      <h2 className="tv-reveal__name">{nameOf(winner.player_id)}</h2>
      <p className="tv-reveal__song">
        {winner.song_title} · {winner.song_artist}
      </p>
    </div>
  );
}
