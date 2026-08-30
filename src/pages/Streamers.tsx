import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';

export default function Streamers() {
  return (
    <PageLayout
      title="For streamers | TuneBoxed"
      description="Put a TuneBoxed song battle on Twitch or TikTok. Share the board as a tab or a browser source, and let chat vote by typing 1 or 2."
      heading="For streamers"
      intro="Everything you need to put a song battle on stream, and what it does and does not need access to."
    >
      <section className="page-section">
        <h2>Setting up</h2>
        <ol className="page-steps">
          <li>
            <span className="page-step-num">1</span>
            <div className="page-step-body">
              <h3>Sign in with Twitch</h3>
              <p>
                This is what tells us which channel to read votes from, and it
                puts your channel name and avatar on the board.
              </p>
            </div>
          </li>
          <li>
            <span className="page-step-num">2</span>
            <div className="page-step-body">
              <h3>Start a room</h3>
              <p>
                You get a five-letter code and a join link. Read the code out or
                drop the link in chat.
              </p>
            </div>
          </li>
          <li>
            <span className="page-step-num">3</span>
            <div className="page-step-body">
              <h3>Put the board on stream</h3>
              <p>
                Every room has a board at its own address, built to be the thing
                your audience looks at: matchup, timer, the vibe, songs and live
                vote counts. Open it in another tab and run the battle from there
                — reveal songs and advance rounds without clicking back to the
                room.
              </p>
              <p>
                No OBS? Share that board tab as your stream. Your buttons fade
                when you stop moving, so they stay off camera. This works on
                every platform and needs nothing installed.
              </p>
              <p>
                Have OBS, Streamlabs, or anything with a Browser Source? Paste
                the same URL in and set it to 1920 by 1080. A Browser Source has
                no login, so it cannot show your buttons. It is a full scene
                rather than a transparent strip, so it does not need anything
                behind it.
              </p>
            </div>
          </li>
          <li>
            <span className="page-step-num">4</span>
            <div className="page-step-body">
              <h3>Tell chat to type 1 or 2</h3>
              <p>
                The board shows both songs numbered, with a live count. Chat
                votes by typing the number on its own.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="page-section">
        <h2>Checking the board before you go live</h2>
        <p>
          <a href="/tv/DEMO1?demo=1">tuneboxed.com/tv/DEMO1?demo=1</a> renders
          the board with sample songs and vote counts, so you can size and place
          it without needing a battle in progress. Any room code works with{' '}
          <code>?demo=1</code> on the end.
        </p>
      </section>

      <section className="page-section">
        <h2>What this can and cannot do to your channel</h2>
        <p>
          Chat is read anonymously, the same way any viewer's browser reads it.
          That means no bot account joins your chat, you grant no moderator or
          chat permissions, and there is no mechanism by which TuneBoxed could
          post a message as you. Reading is the only thing it does.
        </p>
        <p>
          The trade for not running a server is that counting happens in your
          hosting tab. Votes accumulate only while that tab is open, so keep it
          open for the length of the battle.
        </p>
      </section>

      <section className="page-section">
        <h2>Names and song titles</h2>
        <p>
          Display names, and titles from SoundCloud or YouTube, are blocked if
          they use slurs. Ordinary swearing is allowed. Catalogue tracks from
          Apple Music are not re-filtered, because those titles are already on
          a store.
        </p>
        <p>
          Winners are only published to the{' '}
          <Link to="/winners">public winners board</Link> if you choose to
          publish them, and you can publish the winning song without the
          winner's name.
        </p>
      </section>

      <section className="page-section">
        <h2>TikTok and other platforms</h2>
        <p>
          The battle itself works anywhere you can share a link and screen share
          a tab, so TikTok, Kick, YouTube and Discord are all fine. Chat voting
          is Twitch only for now, because it relies on reading Twitch chat.
          Everywhere else the players in the room vote instead, which is also
          how it works when nobody is streaming at all.
        </p>
      </section>

      <p>
        <Link to="/battle">Start a battle</Link> or read the{' '}
        <Link to="/rules">game rules</Link>.
      </p>
    </PageLayout>
  );
}
