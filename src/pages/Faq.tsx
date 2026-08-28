import { Link } from 'react-router-dom';
import PageLayout from './PageLayout';

/**
 * Answers are rendered inside <details>, which keeps them in the DOM while
 * collapsed so they are still readable by crawlers, and mirrored into FAQPage
 * structured data below.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do my viewers need to download anything?',
    a: 'No. They open the link in whatever browser they already have, type a name, and they are in. There is no app to install and no account to create.',
  },
  {
    q: 'Do I need a Twitch account?',
    a: 'Only if you want chat to vote. You can run a battle without signing in, in which case the players in the room vote instead. Signing in with Twitch is what tells us which channel to read votes from.',
  },
  {
    q: 'How does Twitch chat voting work?',
    a: 'During voting your viewers type 1 or 2 for the song they prefer. Each Twitch account gets one vote per matchup, and voting again moves that vote rather than adding a second one.',
  },
  {
    q: 'Does this need a bot in my chat?',
    a: 'No. Chat is read anonymously, so there is no bot account to add, no moderator permissions to grant, and no way for TuneBoxed to post messages as you. It only ever reads.',
  },
  {
    q: 'Do I have to keep the tab open?',
    a: 'Yes. Chat votes are counted in your hosting tab, so they only accumulate while it is open. Closing it mid-vote stops the count until you reopen it.',
  },
  {
    q: 'How many people can play?',
    a: 'A bracket holds up to 16 players picking songs. There is no limit on how many people can vote in chat.',
  },
  {
    q: 'Can I put the battle on my stream?',
    a: 'Yes. Every room has a board at its own address, showing the matchup, the songs and the live vote counts with none of your controls. Open it in a second tab and share that as your stream, or paste the same URL into OBS, Streamlabs or anything else with a Browser Source. No broadcasting software is required.',
  },
  {
    q: 'How long does a battle take?',
    a: 'Players get 90 seconds to pick, and each song plays for 30 seconds. A full 16 player bracket is four stages, so budget somewhere around 20 to 30 minutes depending on how long you leave voting open.',
  },
  {
    q: 'Where do the songs come from?',
    a: "Players search Apple's public music catalogue, and each track plays as a 30 second preview. Nobody needs a Spotify or Apple Music subscription.",
  },
  {
    q: 'Can I use SoundCloud or YouTube?',
    a: 'Yes. Instead of searching, paste a SoundCloud or YouTube link, which is how to battle something the Apple catalogue does not carry. Those tracks play in SoundCloud\u2019s and YouTube\u2019s own players rather than as a preview, so the player stays visible during the matchup and the start is a second or two less tight, particularly if YouTube runs an ad first.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. Hosting and joining a battle on the web is free.',
  },
  {
    q: 'What happens if someone disconnects?',
    a: 'Their slot is held and they can rejoin with the same link. If they do not come back, the battle carries on without them.',
  },
  {
    q: 'Is this the same as the iOS app?',
    a: 'It shares the same servers. Party on the web is the same Battle Mode as the iOS app: best of three, rotating judge. Bracket is the streamer format. The iOS app also has a daily music feed the website does not.',
  },
];

export default function Faq() {
  // Structured data so the answers are eligible to surface directly in search
  // results. Kept generated from the same array as the page so the two cannot
  // say different things.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <PageLayout
      title="FAQ | TuneBoxed"
      description="Answers about TuneBoxed song battles: joining from a browser, chat voting, putting the board on stream, and how long a bracket takes."
      heading="FAQ"
      intro="Questions that come up when running a battle."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-section page-faq">
        {FAQS.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <div className="page-faq-answer">
              <p>{f.a}</p>
            </div>
          </details>
        ))}
      </section>

      <p>
        Still stuck? The <Link to="/rules">game rules</Link> walk through a
        battle step by step, and the{' '}
        <Link to="/streamers">streamer setup guide</Link> covers putting it on
        stream.
      </p>
    </PageLayout>
  );
}
