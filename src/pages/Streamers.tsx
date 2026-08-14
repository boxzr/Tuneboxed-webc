import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';

export default function Streamers() {
  return (
    <PageLayout
      title="For streamers | TuneBoxed"
      description="Run a song battle on your Twitch or TikTok stream: sign in with Twitch, add the OBS browser source, and let chat vote by typing 1 or 2."
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
                puts your channel name and avatar on the overlay.
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
              <h3>Put it on stream</h3>
              <p>
                No OBS? Share this browser tab as your stream. Chat still votes,
                and viewers still join from the code.
              </p>
              <p>
                Have OBS, Streamlabs, or anything with a Browser Source? Every
                room shows a copyable overlay URL. Paste it, set it to 1920 by
                1080, and the transparent overlay sits over your scene.
              </p>
            </div>
          </li>
          <li>
            <span className="page-step-num">4</span>
            <div className="page-step-body">
              <h3>Tell chat to type 1 or 2</h3>
              <p>
                The overlay shows both songs numbered, with a live count. Chat
                votes by typing the number on its own.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="page-section">
        <h2>Positioning the overlay before you go live</h2>
        <p>
          Add <code>?demo=1</code> to the end of the overlay URL and it renders
          with sample songs and vote counts, so you can size and place it in OBS
          without needing a battle in progress. Add <code>&amp;bg=dark</code> if
          you would rather see it on a solid background while you work.
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
        <h2>Viewer names are not moderated</h2>
        <p>
          Players type their own display name when they join, and it appears on
          the overlay. If your chat is large or unfamiliar, that is worth
          knowing before you put the overlay on screen.
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
          The battle itself works anywhere you can share a link and screen
          share the tab. The overlay works in any software that supports a
          browser source, not only OBS. Chat voting is Twitch only for now,
          because it relies on reading Twitch chat. Elsewhere the players in
          the room vote instead.
        </p>
      </section>

      <p>
        <Link to="/battle">Start a battle</Link> or read the{' '}
        <Link to="/rules">game rules</Link>.
      </p>
    </PageLayout>
  );
}
