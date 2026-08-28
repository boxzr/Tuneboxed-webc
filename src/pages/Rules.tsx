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
    body: 'Three or more players. Each round, everyone except the judge locks in a track, with 90 seconds on the clock.',
  },
  {
    title: 'The songs play together',
    body: 'Each pick plays for 30 seconds, in sync for everyone in the room at the same moment.',
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
    body: 'Up to 16 players. Share the code however suits you, including on a stream.',
  },
  {
    title: 'Two songs go head to head',
    body: 'Each matchup plays both tracks for 30 seconds, in sync for everyone in the room.',
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
        <p>Head to head until one song is left. The format a stream can put on screen.</p>
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
          A bracket needs pairs. When the count is odd, one player gets a bye
          and moves to the next stage without playing a matchup.
        </p>
      </section>

      <section className="page-section">
        <h2>Where songs come from</h2>
        <p>
          Search covers Apple's public music catalogue, and each result plays as
          a 30 second preview. Nobody needs a Spotify or Apple Music
          subscription, because everyone in the room plays the same preview
          rather than a stream only some of them can reach.
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
