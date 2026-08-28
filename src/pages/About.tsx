import { Link } from 'react-router-dom';
import PageLayout, { APP_STORE_URL } from './PageLayout';
import Stats from '../components/Stats';

export default function About() {
  return (
    <PageLayout
      title="About | TuneBoxed"
      description="TuneBoxed is a music game: bracket song battles in the browser, and a daily music feed on iOS where you post the song that fits the genre."
      heading="About TuneBoxed"
      intro="A music game about the one thing every group argues over: whose taste is better."
    >
      <section className="page-section">
        <h2>Song battles, on the web</h2>
        <p>
          Someone starts a room, everyone else joins from a browser with a code,
          and each player picks a song. Two tracks play head to head, the room
          votes for the better one, and the bracket runs until a single song is
          left standing.
        </p>
        <p>
          It is built to be watched together. Songs play in sync so everyone
          hears the same thing at the same moment, and every room has a board
          you can put on a TV, a projector or a stream. If you are on Twitch,
          voting can happen in the chat that is already there rather than on a
          second screen.
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
