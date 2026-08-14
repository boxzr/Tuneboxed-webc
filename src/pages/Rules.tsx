import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';

/**
 * How a web battle works.
 *
 * Deliberately describes the browser game only. The iOS app also has a
 * best-of-three rounds format and a rotating judge; neither is reachable from
 * the web, where every room is a bracket and chat decides, so documenting them
 * here would just be wrong for anyone reading this page.
 */
const STEPS = [
  {
    title: 'Start a room',
    body: 'You get a five-letter code. Read it out on stream and your viewers join in their browser. No app, no account, no sign-up.',
  },
  {
    title: 'Everyone picks a song',
    body: 'A bracket holds up to 16 players. Each one searches for a track and locks it in, with 90 seconds on the clock.',
  },
  {
    title: 'Two songs go head to head',
    body: 'Each matchup plays both tracks for 30 seconds, in sync for everyone in the room at the same moment.',
  },
  {
    title: 'Chat votes',
    body: 'Viewers type 1 or 2 in your Twitch chat for the song they want. One vote each, and changing your mind moves your vote rather than adding another.',
  },
  {
    title: 'The winner advances',
    body: 'The song with more votes moves up the bracket. Repeat until one track is left standing, and that one is the champion.',
  },
];

export default function Rules() {
  return (
    <PageLayout
      title="Game rules | TuneBoxed"
      description="How a TuneBoxed song battle works: a bracket of up to 16 players, songs played in sync, and Twitch chat voting for the winner."
      heading="Game rules"
      intro="A song battle is a bracket. Two tracks play back to back, chat picks the better one, and the winner moves on."
    >
      <section className="page-section">
        <ol className="page-steps">
          {STEPS.map((s, i) => (
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
        <h2>What counts as a vote</h2>
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
