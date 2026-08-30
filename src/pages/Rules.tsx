import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';

/**
 * How a web battle works. Two formats share a room code and synced playback;
 * they differ in how a winner is decided.
 */
const PARTY_STEPS = [
  {
    title: 'Start a Party room',
    body: 'You get a five-letter code. Share it in a group chat or read it out. Everyone joins in their browser. No app, no account.',
  },
  {
    title: 'Everyone picks a song',
    body: 'Three or more players. Each round, everyone except the judge locks in a track, with 45 seconds on the clock. Miss it and you are out of the round.',
  },
  {
    title: 'The songs play together',
    body: 'Each pick plays for 15 seconds, in sync for everyone in the room at the same moment.',
  },
  {
    title: 'A rotating judge crowns a winner',
    body: 'One player sits out the pick and chooses the song they liked more. The judge role moves each round.',
  },
  {
    title: 'Best of three',
    body: 'Three rounds, then the player with the most crowns wins.',
  },
];

const BRACKET_STEPS = [
  {
    title: 'Start a Bracket room',
    body: 'Up to 16 players. Share the code however suits you, including on a stream. Bracket opens in Classic.',
  },
  {
    title: 'Pick one vibe, then lock songs in',
    body: 'The host names the vibe for the whole game — sunset, 2016 rap, whatever they want. Players submit before anything starts. There is no clock and nothing is live yet, so nobody is rushed.',
  },
  {
    title: 'Two songs go head to head',
    body: 'Each matchup plays both tracks for 15 seconds, in sync for everyone in the room. Those are the songs people locked in, not a new pick each round.',
  },
  {
    title: 'The room votes',
    body: 'Everyone in the room picks the track they liked more, except the two in the matchup. If the host is on Twitch, chat can vote too by typing 1 or 2.',
  },
  {
    title: 'The winner advances',
    body: 'The song with more votes moves up the bracket. A tie, or no votes at all, is a coin flip. Repeat until one track is left standing.',
  },
];

export default function Rules() {
  return (
    <PageLayout
      title="Game rules | TuneBoxed"
      description="How a TuneBoxed song battle works: Party is best of three with a rotating judge, Bracket is a head-to-head tournament of up to 16."
      heading="Game rules"
      intro="Two ways to play in the browser. Same songs, same room code, different path to a winner."
    >
      <section className="page-section">
        <h2>Party</h2>
        <p>The same Battle Mode as the iOS app. Built for a group around a table or on a call.</p>
        <ol className="page-steps">
          {PARTY_STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="page-step-num">{i + 1}</span>
              <div className="page-step-body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="page-section">
        <h2>Bracket</h2>
        <p>
          Head to head until one song is left. The format a stream can put on screen.
          Classic is the default: one vibe, songs in first. Switch to TuneBoxed mode
          in game settings if you want a fresh random vibe each matchup and a live
          pick clock.
        </p>
        <ol className="page-steps">
          {BRACKET_STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="page-step-num">{i + 1}</span>
              <div className="page-step-body">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="page-section">
        <h2>What counts as a vote in Twitch chat</h2>
        <p>
          Only a message that is exactly the number counts. Typing{' '}
          <strong>1</strong> votes for the first song; typing "1 is better" does
          not. Chat during a battle is full of digits, and matching loosely
          would quietly miscount the result.
        </p>
        <p>
          Votes are counted while your hosting tab is open. If you close it
          mid-vote, chat votes stop being counted until you reopen it.
        </p>
      </section>

      <section className="page-section">
        <h2>Odd numbers of players</h2>
        <p>
          A bracket needs pairs. When the count is odd, byes are spread across
          the first stage rather than piled at the end, so at most one player
          per matchup sits it out. A bye moves you to the next stage without
          playing. In TuneBoxed mode you pick again there; in Classic you keep
          the song you locked in.
        </p>
        <p>
          If you ever reach a matchup with nobody opposite you, you take it
          without a round rather than waiting for an opponent who is never
          coming.
        </p>
      </section>

      <section className="page-section">
        <h2>Missing the clock</h2>
        <p>
          When the pick timer hits zero the round closes on whatever is in. If
          only one person got a song in, they take the round: turning up beats
          not turning up. If nobody did, the host can put more time on the
          clock.
        </p>
      </section>

      <section className="page-section">
        <h2>Where songs come from</h2>
        <p>
          Search covers Apple's public music catalogue, and each result plays as
          a 15 second clip. Nobody needs a Spotify or Apple Music
          subscription, because everyone in the room plays the same preview
          rather than a stream only some of them can reach.
        </p>
        <p>
          Switch search to music videos to battle with the video instead of the
          track. It runs on the same clock and the same 15 seconds, so the room
          watches it together rather than only hearing it.
        </p>
        <p>
          You can also paste a SoundCloud or YouTube link instead of searching,
          which is how to battle a song the Apple catalogue does not carry. Those
          play in SoundCloud's and YouTube's own players, so they stay on screen
          during the matchup. They also start a beat less precisely than a
          preview does, since the player has to load first and YouTube may run
          an ad, so expect a second or two of slack rather than the exact sync
          you get from search.
        </p>
      </section>

      <p>
        <Link to="/battle">Start a battle</Link> or read the{' '}
        <Link to="/faq">FAQ</Link>.
      </p>
    </PageLayout>
  );
}
