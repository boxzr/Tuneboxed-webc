import { Link } from 'react-router-dom';
import PageLayout, { APP_STORE_URL } from './PageLayout';
import Stats from '../components/Stats';

export default function About() {
  return (
    <PageLayout
      title="About | TuneBoxed"
      description="TuneBoxed is a music game. On the web it is song battles for streamers; on iOS it is a daily music feed where you post the song that fits the genre."
      heading="About TuneBoxed"
      intro="A music game about the one thing every group argues over: whose taste is better."
    >
      <section className="page-section">
        <h2>Song battles, on the web</h2>
        <p>
          A streamer starts a room, viewers join from a browser with a code, and
          everyone picks a song. Two tracks play head to head, chat votes for
          the better one, and the bracket runs until a single song is left.
        </p>
        <p>
          It is built to be watched. Songs play in sync so the whole room hears
          the same thing at the same moment, the scoreboard drops into OBS as a
          browser source, and voting happens in the chat that is already there
          rather than on a second screen.
        </p>
      </section>

      <section className="page-section">
        <h2>The iOS app</h2>
        <p>
          TuneBoxed started on iPhone and still lives there. Every day brings a
          new genre, you post the song that fits it best, and the community
          votes. There are battles too, with formats the web does not have, plus
          ranks and matching with people who post the same things you do.
        </p>
        <p>
          <a
            href={APP_STORE_URL}
            className="app-store-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download on the App Store
          </a>
        </p>
      </section>

      <section className="page-section">
        <Stats heading="By the numbers" />
      </section>

      <section className="page-section">
        <h2>Who makes it</h2>
        <p>
          TuneBoxed is built by Aura Brand LLC.
        </p>
      </section>

      <p>
        <Link to="/battle">Start a battle</Link>, read the{' '}
        <Link to="/rules">game rules</Link>, or see the{' '}
        <Link to="/winners">winners board</Link>.
      </p>
    </PageLayout>
  );
}
