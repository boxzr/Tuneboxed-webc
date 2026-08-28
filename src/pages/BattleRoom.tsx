import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as battle from '../lib/battleClient';
import { useBattleRoom } from '../battle/useBattleRoom';
import { useBattleRound } from '../battle/useBattleRound';
import { useSyncedPlayback } from '../battle/useSyncedPlayback';
import { useChatVotes } from '../battle/useChatVotes';
import { secondsUntil, syncClock } from '../battle/clock';
import { nextGenre } from '../battle/genres';
import { uniqueLeader } from '../battle/voteLeader';
import SongPicker from '../battle/SongPicker';
import EmbedPlayer from '../battle/EmbedPlayer';
import RoomShell, { RoomHeader } from '../battle/RoomShell';
import StreamCard from '../battle/StreamCard';
import { GameSettingsButton, GameSettingsPanel, resolvedVoting, rulesSummary } from '../battle/GameSettings';
import BracketTree from '../battle/ui/BracketTree';
import MatchupCard from '../battle/ui/MatchupCard';
import NowPlaying from '../battle/ui/NowPlaying';
import Roster from '../battle/ui/Roster';
import {
  Card,
  CountdownRing,
  Gloves,
  PromptLabel,
  SectionLabel,
  StatTile,
  TextButton,
  VividButton,
} from '../battle/ui/primitives';
import { CheckIcon, CrownIcon, PlayIcon, TrophyIcon, UsersIcon } from '../battle/ui/icons';
import type { BattleMatch, BattlePlayer, BattleSubmission } from '../types/battle';
import '../battle/battle.css';
import '../battle/ui/ui.css';
import '../battle/ui/room.css';

const PICK_SECONDS = 90;
const CLIP_SECONDS = 30;
const PARTY_ROUNDS = 3;

export default function BattleRoom() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const stored = useMemo(() => battle.loadSession(code), [code]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void syncClock();
  }, []);

  useEffect(() => {
    let cancelled = false;
    battle
      .getRoomByCode(code)
      .then((room) => {
        if (cancelled) return;
        if (!room) setLookupError("That room code doesn't exist.");
        else setRoomId(room.id);
      })
      .catch((e) => !cancelled && setLookupError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [code]);

  const { room, players, matches, loading, refresh } = useBattleRoom(roomId, stored?.token ?? null);
  const { round, submissions, votes } = useBattleRound(room);
  const [crowns, setCrowns] = useState<Record<string, number>>({});

  const me = players.find((p) => p.id === stored?.playerId) ?? null;
  const isHost = Boolean(room && me && room.host_player_id === me.id);
  const token = stored?.token ?? null;

  const phase = round?.phase ?? null;
  const hearAudio = !room?.host_speaker_enabled || isHost;
  const playback = useSyncedPlayback(round, submissions, phase === 'playing' && hearAudio);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  useSecondTicker(phase === 'picking' || phase === 'judging');

  // Only the host reads chat. Every viewer opening an IRC connection would
  // multiply the load for no gain, and the tally is host-only to write anyway.
  const chatChannel = isHost && room?.format === 'bracket' ? room.host_twitch_login ?? null : null;
  const chat = useChatVotes({
    enabled: isHost,
    channel: chatChannel,
    round,
    submissions,
    token,
  });

  // Prompts already used this room, so a bracket does not ask the same
  // question twice. Chat notices immediately when it does.
  const usedGenres = useRef<string[]>([]);
  useEffect(() => {
    const genre = round?.genre;
    if (genre && !usedGenres.current.includes(genre)) usedGenres.current.push(genre);
  }, [round?.genre]);

  useEffect(() => {
    if (!loading && roomId && !stored) navigate(`/join/${code.toUpperCase()}`, { replace: true });
  }, [loading, roomId, stored, code, navigate]);

  /*
   * Close the playing phase once the last clip has run out.
   *
   * Nothing else does this. The songs would finish, the room would sit on a
   * silent now-playing card, and the only way out would be for the host to
   * reload. The host drives it because it is the only client allowed to move
   * the phase, and the ref makes sure a room that re-renders during the call
   * does not fire it twice.
   */
  const advancedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isHost || !token || phase !== 'playing' || !playback.finished) return;
    const roundId = round?.id;
    if (!roundId || advancedRef.current === roundId) return;
    advancedRef.current = roundId;
    void battle.advancePhase(token, roundId, 'judging', 60).catch(() => {
      // Let the next tick retry rather than stranding the room.
      advancedRef.current = null;
    });
  }, [isHost, token, phase, playback.finished, round?.id]);

  const guard = useCallback(async (fn: () => Promise<unknown>) => {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  /** Opens a fresh picking round scoped to one head-to-head matchup. */
  const startMatchRound = useCallback(
    async (match: BattleMatch, roomRoundNumber: number) => {
      const created = await battle.startRound(token!, {
        roundNumber: roomRoundNumber + 1,
        genre: nextGenre(usedGenres.current),
        pickSeconds: PICK_SECONDS,
        matchId: match.id,
      });
      await battle.setMatchRound(token!, match.id, created.id, 'active');
      await refresh();
    },
    [token, refresh]
  );

  /** Opens the next party round: everyone picks, a rotating judge crowns. */
  const startPartyRound = useCallback(
    async (roomRoundNumber: number) => {
      const wantsJudge = room && room.format !== 'bracket' && resolvedVoting(room) === 'judge';
      const judgeId = wantsJudge ? await battle.pickNextJudge(token!) : null;
      await battle.startRound(token!, {
        roundNumber: roomRoundNumber + 1,
        genre: nextGenre(usedGenres.current),
        pickSeconds: PICK_SECONDS,
        judgePlayerId: judgeId,
      });
      await refresh();
    },
    [token, refresh, room]
  );

  useEffect(() => {
    if (!roomId || room?.format === 'bracket') return;
    let live = true;
    void Promise.all([battle.getRounds(roomId), battle.getRoomSubmissions(roomId)]).then(
      ([rounds, subs]) => {
        const byId = new Map(subs.map((s) => [s.id, s]));
        const next: Record<string, number> = {};
        for (const r of rounds) {
          const sub = r.winner_submission_id ? byId.get(r.winner_submission_id) : undefined;
          if (!sub) continue;
          next[sub.player_id] = (next[sub.player_id] ?? 0) + 1;
        }
        if (live) setCrowns(next);
      }
    );
    return () => {
      live = false;
    };
  }, [roomId, room?.format, round?.phase, round?.winner_submission_id]);

  if (lookupError) {
    return (
      <RoomShell>
        <Card>
          <h1 className="bt-h1">Can't open this room</h1>
          <p className="bt-sub">{lookupError}</p>
          <VividButton onClick={() => navigate('/battle')}>Back</VividButton>
        </Card>
      </RoomShell>
    );
  }

  if (loading || !room) {
    return (
      <RoomShell>
        <Card>
          <p className="bt-sub" style={{ margin: 0 }}>
            Loading room…
          </p>
        </Card>
      </RoomShell>
    );
  }

  const connected = players.filter((p) => p.is_connected);
  const joinUrl = `${window.location.origin}/join/${room.code}`;
  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.display_name ?? 'Someone';

  const isBracket = room.format === 'bracket';
  const currentMatch = matches.find((m) => m.id === room.current_match_id) ?? null;

  // The bracket is decided when the match that feeds nowhere has a winner.
  const bracketChampionId =
    matches.find((m) => m.next_match_id === null && m.winner_player_id)?.winner_player_id ?? null;
  const partyChampionId =
    !isBracket && room.status === 'complete' ? crownLeader(crowns, players) : null;
  const championId = isBracket ? bracketChampionId : partyChampionId;

  // In a bracket only the two competitors pick a song; everybody else is an
  // audience with a vote.
  const isCompetitor = (p: BattlePlayer | null) =>
    Boolean(p && currentMatch && (p.id === currentMatch.player_a_id || p.id === currentMatch.player_b_id));

  const judgeId = round?.judge_player_id ?? null;
  const isJudge = Boolean(me && judgeId === me.id);
  const votingMode = resolvedVoting(room);
  const canPick = isBracket
    ? isCompetitor(me)
    : votingMode === 'judge'
      ? Boolean(me && me.id !== judgeId)
      : Boolean(me);

  const myVote = votes.find((v) => v.voter_player_id === me?.id) ?? null;
  const mySubmission = submissions.find((s) => s.player_id === me?.id) ?? null;

  // A room tied to a Twitch channel hands the decision to chat, so the in-room
  // crown buttons become a read-only scoreboard for everyone. The host shows
  // its own live counts because those update between reports; everyone else
  // reads what the host last published.
  const chatTally = room.host_twitch_login
    ? isHost
      ? chat.counts
      : round?.chat_tally ?? {}
    : null;

  // Nobody in the room is eligible to vote when every player is in the
  // matchup, which is exactly what a two player bracket looks like. The AI
  // judge exists for that case rather than leaving the round wedged.
  const needsAiJudge =
    isBracket && !chatTally && connected.length > 0 && connected.every((p) => isCompetitor(p));

  const canVote =
    Boolean(me) &&
    !needsAiJudge &&
    !chatTally &&
    (votingMode === 'everyone'
      ? true
      : votingMode === 'host'
        ? isHost
        : isJudge);

  const submissionOf = (playerId: string | null) =>
    playerId ? submissions.find((s) => s.player_id === playerId) ?? null : null;

  const matchupSides = currentMatch
    ? {
        left: {
          name: nameOf(currentMatch.player_a_id),
          votes: voteCountFor(currentMatch.player_a_id),
        },
        right: {
          name: nameOf(currentMatch.player_b_id),
          votes: voteCountFor(currentMatch.player_b_id),
        },
      }
    : null;

  function voteCountFor(playerId: string | null): number | null {
    if (phase !== 'judging' && phase !== 'revealed') return null;
    const submission = submissionOf(playerId);
    if (!submission) return null;
    if (chatTally) return chatTally[submission.id] ?? 0;
    return votes.filter((v) => v.submission_id === submission.id).length;
  }

  const ballotCounts: Record<string, number> = {};
  for (const s of submissions) {
    ballotCounts[s.id] = chatTally
      ? chatTally[s.id] ?? 0
      : votes.filter((v) => v.submission_id === s.id).length;
  }
  const voteLeader = uniqueLeader(ballotCounts);
  const ballotTotal = Object.values(ballotCounts).reduce((a, b) => a + b, 0);

  /**
   * Which fighter to crown.
   *
   * The round decides a winner before the match record knows about it, since
   * reporting the match is the host's next action. Reading the round first
   * means the crown lands with the reveal rather than a click later.
   */
  const winnerSide = (): 'left' | 'right' | null => {
    const roundWinner = submissions.find((s) => s.id === round?.winner_submission_id)?.player_id;
    const winnerId = roundWinner ?? currentMatch?.winner_player_id;
    if (!winnerId || !currentMatch) return null;
    return winnerId === currentMatch.player_a_id ? 'left' : 'right';
  };

  const stageLabel = isBracket
    ? currentMatch
      ? roundTitle(currentMatch.bracket_round, matches)
      : `${connected.length} in the room`
    : round
      ? `Round ${round.round_number} of ${PARTY_ROUNDS}`
      : `${connected.length} in the room`;

  const saveSettings = (patch: Parameters<typeof battle.updateRoomSettings>[1]) =>
    void guard(async () => {
      await battle.updateRoomSettings(token!, patch);
      await refresh();
    });

  return (
    <RoomShell>
      <RoomHeader
        code={room.code}
        stage={round ? `${stageLabel} · ${round.genre}` : stageLabel}
        compact={Boolean(round) || championId !== null}
      />

      {/* ---------- Champion ---------- */}
      {championId && (
        <Card tone="orange" className="bt-champion">
          <span className="bt-champion__trophy">
            <TrophyIcon size={40} />
          </span>
          <SectionLabel tone="orange">Champion</SectionLabel>
          <h2 className="bt-champion__name">{nameOf(championId)}</h2>
          <p className="bt-sub">
            {isBracket ? 'Winner of the whole bracket.' : `Most crowns after ${PARTY_ROUNDS} rounds.`}
          </p>

          {isHost && (
            <VividButton
              disabled={busy}
              onClick={() =>
                void guard(async () => {
                  await battle.resetForRematch(token!);
                  usedGenres.current = [];
                  await refresh();
                })
              }
            >
              Run it back
            </VividButton>
          )}
        </Card>
      )}

      {/* ---------- Lobby ---------- */}
      {!round && !championId && (
        <>
          <Card className="bt-lobby">
            <Gloves size={132} />
            <p className="bt-lobby__pitch">
              {isBracket
                ? 'Everyone picks a song. Two go head to head. The room votes and the bracket advances until one is left.'
                : votingMode === 'host'
                  ? 'Everyone picks a song. They play together. You crown the winner. Best of three, most crowns takes it.'
                  : votingMode === 'everyone'
                    ? 'Everyone picks a song. They play together. The room votes. Best of three, most crowns takes it.'
                    : 'Everyone picks a song. They play together. A rotating judge crowns the winner. Best of three, most crowns takes it.'}
            </p>
          </Card>

          <Card>
            <SectionLabel>
              Players · {connected.length}/{room.max_players}
            </SectionLabel>
            <div style={{ marginTop: 12 }}>
              <Roster
                players={players}
                hostId={room.host_player_id}
                meId={me?.id ?? null}
                waitingSlots={Math.max(0, room.min_players - connected.length)}
              />
            </div>

            {isHost ? (
              connected.length < room.min_players ? (
                <p className="bt-sub bt-sub--center" style={{ marginBottom: 0 }}>
                  Waiting for {room.min_players - connected.length} more to start.
                </p>
              ) : (
                <VividButton
                  icon={<PlayIcon size={18} />}
                  disabled={busy}
                  onClick={() =>
                    void guard(async () => {
                      if (isBracket) {
                        await battle.generateBracket(token!);
                        const fresh = await battle.getRoom(room.id);
                        const seeded = await battle.getMatches(room.id);
                        const first =
                          seeded.find((m) => m.id === fresh?.current_match_id) ??
                          seeded.find(
                            (m) => m.status === 'pending' && m.player_a_id && m.player_b_id
                          );
                        if (!first) throw new Error('Could not build a bracket from this room.');
                        await startMatchRound(first, fresh?.round_number ?? 0);
                      } else {
                        await startPartyRound(room.round_number);
                      }
                    })
                  }
                >
                  {isBracket ? 'Start the bracket' : 'Start the battle'}
                </VividButton>
              )
            ) : (
              <p className="bt-sub bt-sub--center" style={{ marginBottom: 0 }}>
                Waiting for {nameOf(room.host_player_id)} to start.
              </p>
            )}
          </Card>

          {isHost && isBracket && <StreamCard code={room.code} />}

          {isHost && (
            <>
              {settingsOpen && (
                <GameSettingsPanel
                  room={room}
                  playerCount={players.length}
                  aiJudge={needsAiJudge}
                  onChange={saveSettings}
                />
              )}
              <GameSettingsButton
                summary={rulesSummary(room, needsAiJudge)}
                open={settingsOpen}
                onClick={() => setSettingsOpen((o) => !o)}
              />
            </>
          )}
        </>
      )}

      {/* ---------- Matchup, shown through every phase of a match ---------- */}
      {isBracket && currentMatch && matchupSides && phase && (
        <MatchupCard
          title={roundTitle(currentMatch.bracket_round, matches)}
          left={matchupSides.left}
          right={matchupSides.right}
          winnerSide={phase === 'revealed' ? winnerSide() : null}
        />
      )}

      {/* ---------- Picking ---------- */}
      {phase === 'picking' && round && (
        <Card>
          <div className="bt-genre">
            <PromptLabel>This round&rsquo;s vibe</PromptLabel>
            <h2 className="bt-genre__title">{round.genre}</h2>
          </div>

          <div className="bt-tiles">
            <StatTile
              icon={<UsersIcon size={17} />}
              value={`${submissions.length}/${expectedPickers(currentMatch, connected, votingMode === 'judge' ? judgeId : null)}`}
              label="Locked in"
            />
            <CountdownRing
              seconds={secondsUntil(round.phase_deadline_at)}
              progress={ringProgress(round.phase_deadline_at, PICK_SECONDS)}
            />
            <StatTile
              icon={<TrophyIcon size={17} />}
              value={
                isBracket
                  ? roundTitle(currentMatch?.bracket_round ?? 1, matches).split(' ')[0]
                  : `${round.round_number}/${PARTY_ROUNDS}`
              }
              label={isBracket ? 'Stage' : 'Round'}
            />
          </div>

          {canPick ? (
            mySubmission ? (
              <Card tone="green" className="bt-locked">
                <span className="bt-locked__icon">
                  <CheckIcon size={22} />
                </span>
                <SectionLabel>Your pick is in</SectionLabel>
                <strong className="bt-locked__title">{mySubmission.song_title}</strong>
                <span className="bt-sub">{mySubmission.song_artist}</span>
              </Card>
            ) : (
              <SongPicker
                disabled={busy}
                onPick={(song) =>
                  guard(() =>
                    battle.submitSong(token!, round.id, {
                      title: song.title,
                      artist: song.artist,
                      artworkUrl: song.artworkUrl,
                      previewUrl: song.previewUrl,
                      externalId: song.externalId,
                      source: song.source,
                    })
                  )
                }
              />
            )
          ) : (
            <p className="bt-sub bt-sub--center" style={{ margin: 0 }}>
              {isJudge && votingMode === 'judge'
                ? "You're the judge this round. Sit back while everyone picks, then you crown the winner."
                : matchupSides
                  ? `${matchupSides.left.name} and ${matchupSides.right.name} are picking. Get ready to vote.`
                  : 'Waiting for the next round.'}
            </p>
          )}

          {isHost && submissions.length >= 2 && (
            <VividButton
              // Once everyone is in, this is the only thing left to do, so it
              // stops being a shortcut and becomes the call to action.
              variant={
                submissions.length >= expectedPickers(currentMatch, connected, votingMode === 'judge' ? judgeId : null)
                  ? 'filled'
                  : 'outline'
              }
              tone="blue"
              icon={<PlayIcon size={16} />}
              disabled={busy}
              onClick={() =>
                void guard(() =>
                  battle.startPlayback(
                    token!,
                    round.id,
                    submissions.map((s) => s.id),
                    CLIP_SECONDS
                  )
                )
              }
            >
              Play them now
            </VividButton>
          )}
        </Card>
      )}

      {/* ---------- Playing ---------- */}
      {phase === 'playing' && (
        <Card>
          <div className="bt-phase-head">
            <SectionLabel tone="blue">
              Track {Math.min(playback.index + 1, playback.total)} of {playback.total}
            </SectionLabel>
          </div>

          {(playback.blocked || embedBlocked) && hearAudio && (
            <VividButton
              tone="blue"
              icon={<PlayIcon size={18} />}
              onClick={() => {
                playback.unblock();
                setEmbedBlocked(false);
              }}
            >
              Tap to hear the battle
            </VividButton>
          )}

          {!hearAudio && (
            <p className="bt-sub bt-sub--center">Songs are playing from the host&rsquo;s speaker.</p>
          )}

          {playback.current ? (
            <>
              <NowPlaying
                title={playback.current.song_title}
                artist={playback.current.song_artist}
                pickedBy={nameOf(playback.current.player_id)}
                artworkUrl={playback.current.artwork_url}
                progress={playback.offset / playback.perSong}
              />

              {/* SoundCloud and YouTube picks play in the provider's own
                  player, which has to stay on screen. iTunes previews are
                  plain audio and need nothing here. */}
              {hearAudio && embedSourceOf(playback.current) && (
                <EmbedPlayer
                  source={embedSourceOf(playback.current)!}
                  externalId={playback.current.external_id ?? ''}
                  offset={playback.offset}
                  playing
                  onBlocked={setEmbedBlocked}
                />
              )}
            </>
          ) : (
            <p className="bt-sub bt-sub--center" style={{ margin: 0 }}>
              Getting the first track ready…
            </p>
          )}

          {/* One shared countdown, read off the same server clock everywhere, so
              a room full of embeds changes track together even though each
              player takes a different amount of time to load. */}
          {playback.secondsUntilNext !== null && playback.secondsUntilNext <= 3 && (
            <p className="bt-countdown" aria-live="polite">
              Next up in {Math.ceil(playback.secondsUntilNext)}
            </p>
          )}
        </Card>
      )}

      {/* ---------- Judging ---------- */}
      {phase === 'judging' && round && (
        <Card>
          <div className="bt-phase-head">
            <SectionLabel tone="orange">Crown a winner</SectionLabel>
            <p className="bt-sub bt-sub--center">
              {chatTally ? (
                voteLeader ? (
                  <>
                    Twitch chat decides. Viewers type <strong>1</strong> or <strong>2</strong>.
                  </>
                ) : ballotTotal === 0 ? (
                  'No chat votes yet. Revealing lets the AI judge call it.'
                ) : (
                  'Chat is tied. Revealing lets the AI judge call it.'
                )
              ) : needsAiJudge ? (
                'Nobody in the room can vote on their own song, so the AI judge calls it.'
              ) : votingMode === 'host' ? (
                isHost ? 'You pick the winner.' : `Waiting for ${nameOf(room.host_player_id)} to crown a winner.`
              ) : votingMode === 'judge' ? (
                isJudge
                  ? 'You are the judge. Pick the song you liked more.'
                  : `Waiting for ${nameOf(judgeId)} to crown a winner.`
              ) : voteLeader ? (
                isBracket
                  ? 'Everyone votes, except the two in the matchup.'
                  : 'Everyone in the room votes. You cannot pick your own song.'
              ) : ballotTotal === 0 ? (
                'No votes yet. Revealing lets the AI judge call it.'
              ) : (
                "It's a tie. Revealing lets the AI judge call it."
              )}
            </p>
          </div>

          <ul className="bt-ballot">
            {submissions.map((s, i) => {
              const mine = s.player_id === me?.id;
              const chosen = myVote?.submission_id === s.id;
              const count = chatTally
                ? chatTally[s.id] ?? 0
                : votes.filter((v) => v.submission_id === s.id).length;

              return (
                <li key={s.id}>
                  <button
                    className={`bt-choice${chosen ? ' bt-choice--chosen' : ''}`}
                    disabled={busy || mine || Boolean(myVote) || !canVote}
                    onClick={() => void guard(() => battle.castVote(token!, round.id, s.id))}
                  >
                    <span className="bt-choice__num">{i + 1}</span>

                    {s.artwork_url ? (
                      <img src={s.artwork_url} alt="" className="bt-choice__art" />
                    ) : (
                      <div className="bt-choice__art bt-choice__art--empty" />
                    )}

                    <span className="bt-choice__text">
                      <strong>{s.song_title}</strong>
                      <span>
                        {s.song_artist} · {nameOf(s.player_id)}
                      </span>
                    </span>

                    <span className="bt-choice__count">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {chatChannel && (
            <p className="bt-sub bt-sub--center" style={{ marginBottom: 0 }}>
              {chat.connected
                ? `Chat is voting in #${chatChannel}. ${chat.total} ${
                    chat.total === 1 ? 'vote' : 'votes'
                  } so far.`
                : `Connecting to #${chatChannel}…`}
            </p>
          )}

          {isHost && (
            <VividButton
              icon={<CrownIcon size={18} />}
              disabled={busy || submissions.length === 0}
              onClick={() =>
                void guard(async () => {
                  // A unique lead from chat or the room stands. Anything else
                  // (nobody voted, or a tie) is a coin flip, same as a two
                  // player bracket where nobody is allowed to vote at all.
                  if (voteLeader) {
                    await battle.setRoundWinner(token!, round.id, voteLeader);
                  } else {
                    try {
                      await battle.pickAiRoundWinner(token!, round.id);
                    } catch {
                      const pick =
                        submissions[Math.floor(Math.random() * submissions.length)];
                      if (pick) await battle.setRoundWinner(token!, round.id, pick.id);
                    }
                  }
                })
              }
            >
              {voteLeader || needsAiJudge ? 'Reveal the winner' : 'Let the AI judge call it'}
            </VividButton>
          )}
        </Card>
      )}

      {/* ---------- Revealed ---------- */}
      {phase === 'revealed' && round && (
        <Card tone="orange" className="bt-reveal">
          {(() => {
            const winning = submissions.find((s) => s.id === round.winner_submission_id);
            if (!winning) {
              return (
                <p className="bt-sub" style={{ margin: 0 }}>
                  No winner recorded for this round.
                </p>
              );
            }
            return (
              <>
                <span className="bt-reveal__crown">
                  <CrownIcon size={34} />
                </span>
                <SectionLabel tone="orange">Takes the round</SectionLabel>
                <h2 className="bt-reveal__name">{nameOf(winning.player_id)}</h2>
                <p className="bt-reveal__song">
                  {winning.song_title} · {winning.song_artist}
                </p>
              </>
            );
          })()}

          {isHost && room.status !== 'complete' && (
            <VividButton
              disabled={busy}
              onClick={() =>
                void guard(async () => {
                  const winning = submissions.find((s) => s.id === round.winner_submission_id);
                  if (!winning) return;

                  if (!isBracket) {
                    if (room.round_number >= PARTY_ROUNDS) {
                      await battle.setRoomStatus(token!, 'complete');
                      await refresh();
                    } else {
                      await startPartyRound(room.round_number);
                    }
                    return;
                  }

                  if (!currentMatch) return;
                  const nextId = await battle.reportMatchWinner(
                    token!,
                    currentMatch.id,
                    winning.player_id
                  );
                  const seeded = await battle.getMatches(room.id);
                  const next = nextId ? seeded.find((m) => m.id === nextId) : null;

                  if (next) await startMatchRound(next, room.round_number);
                  else {
                    await battle.setRoomStatus(token!, 'complete');
                    await refresh();
                  }
                })
              }
            >
              {isBracket
                ? currentMatch?.next_match_id
                  ? 'Next matchup'
                  : 'Crown the champion'
                : room.round_number >= PARTY_ROUNDS
                  ? 'See who won'
                  : 'Next round'}
            </VividButton>
          )}
        </Card>
      )}

      {isBracket && matches.length > 0 && (
        <BracketTree
          matches={matches}
          players={players}
          currentMatchId={room.current_match_id}
        />
      )}

      {round && isHost && isBracket && <StreamCard code={room.code} />}

      {round && isHost && (
        <>
          {settingsOpen && (
            <GameSettingsPanel
              room={room}
              playerCount={players.length}
              aiJudge={needsAiJudge}
              onChange={saveSettings}
            />
          )}
          <GameSettingsButton
            summary={rulesSummary(room, needsAiJudge)}
            open={settingsOpen}
            onClick={() => setSettingsOpen((o) => !o)}
          />
        </>
      )}

      <Card>
        {/* The lobby already gives the roster a card of its own, with empty
            seats and a count. Repeating it here would just be the same list
            twice on the same screen. */}
        {round ? (
          <>
            <SectionLabel>In the room</SectionLabel>
            <div style={{ marginTop: 12 }}>
              <Roster
                players={players}
                hostId={room.host_player_id}
                judgeId={judgeId}
                meId={me?.id ?? null}
                statusOf={
                  phase === 'picking'
                    ? (p) =>
                        isBracket
                          ? !isCompetitor(p)
                            ? null
                            : submissions.some((s) => s.player_id === p.id)
                              ? 'locked'
                              : 'picking'
                          : p.id === judgeId && votingMode === 'judge'
                            ? null
                            : submissions.some((s) => s.player_id === p.id)
                              ? 'locked'
                              : 'picking'
                    : undefined
                }
              />
            </div>
          </>
        ) : (
          <p className="bt-joinurl" style={{ marginTop: 0 }}>
            Join at <strong>{joinUrl}</strong>
          </p>
        )}

        <TextButton
          onClick={() =>
            void guard(async () => {
              if (token) await battle.leaveRoom(token).catch(() => {});
              battle.clearSession(code);
              navigate('/battle');
            })
          }
        >
          Leave room
        </TextButton>
      </Card>

      {actionError && <div className="bt-error">{actionError}</div>}
    </RoomShell>
  );
}

// ---------------------------------------------------------------

/** How many people are expected to submit this round. */
function expectedPickers(
  match: BattleMatch | null,
  connected: BattlePlayer[],
  judgeId: string | null
): number {
  if (match) return [match.player_a_id, match.player_b_id].filter(Boolean).length;
  return connected.filter((p) => p.id !== judgeId).length;
}

function crownLeader(crowns: Record<string, number>, players: BattlePlayer[]): string | null {
  let best: string | null = null;
  let n = 0;
  for (const p of players) {
    const c = crowns[p.id] ?? 0;
    if (c > n) {
      n = c;
      best = p.id;
    }
  }
  return n > 0 ? best : null;
}

/**
 * Bracket rounds are named backwards from the end, which is how people
 * actually talk about them.
 */
function roundTitle(round: number, matches: BattleMatch[]): string {
  const finalRound = matches.length ? Math.max(...matches.map((m) => m.bracket_round)) : round;
  const fromEnd = finalRound - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinal';
  if (fromEnd === 2) return 'Quarterfinal';
  return `Round ${round}`;
}

/** How much of the pick window is left, as 1 down to 0, for the ring. */
function ringProgress(deadline: string | null, total: number): number {
  if (!deadline) return 0;
  return Math.max(0, Math.min(1, secondsUntil(deadline) / total));
}

/**
 * Re-renders once a second so a deadline visibly counts down.
 *
 * The playing phase gets this for free because the playback hook ticks four
 * times a second, but picking and judging derive their clock purely from a
 * timestamp and would otherwise sit frozen until the next realtime event.
 */
function useSecondTicker(active: boolean): void {
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
}

/**
 * Which embedded player a submission needs, or null when it is a plain audio
 * preview. Keyed off `source` rather than the absence of a preview URL, so a
 * pick that simply failed to resolve does not silently mount a player with
 * nothing to play.
 */
function embedSourceOf(submission: BattleSubmission): 'soundcloud' | 'youtube' | null {
  if (!submission.external_id) return null;
  if (submission.source === 'soundcloud') return 'soundcloud';
  if (submission.source === 'youtube') return 'youtube';
  return null;
}
