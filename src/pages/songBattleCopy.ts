import type { Section } from '../i18n/content/en';

/**
 * Copy for /song-battle, the page aimed at people searching "song battle".
 *
 * English only: the query it answers is English, and scripts/prerender.mjs
 * reads this file directly to put the same text into the static HTML.
 * Inline markup follows <Rich>: [label](/path), **bold**, `code`.
 */
export const songBattle = {
  title: 'What Is a Song Battle? Rules, Ideas and How to Play | TuneBoxed',
  description:
    'A song battle is a music game where songs go head to head and the room votes. How to play one free online with friends or Twitch chat, plus 30 theme ideas.',
  heading: 'Song battle',
  intro:
    'A song battle is a music game where songs go head to head and the room votes for a winner. Here is how it works, how to run one for free with friends or on Twitch, and themes to get you started.',

  whatHeading: 'What is a song battle?',
  what: [
    'Everyone picks a song that fits a theme. Two songs are played back to back, the room votes for the one they liked more, and the winner moves on. Keep going until one song is left. That is a song battle, sometimes called a music battle, an aux battle or aux wars.',
    'On TuneBoxed every matchup is fought as a boxing match. Each song walks out as a cartoon music-note boxer, and once the bell rings every vote lands a punch on the other song. Three in a row is a combo, and a song nobody votes for gets knocked out.',
  ],

  howHeading: 'How to play a song battle online',
  steps: [
    {
      title: 'Start a room',
      body: 'Open [tuneboxed.com/battle](/battle) and host a battle. You get a five-letter code. It is free and there is no account to make.',
    },
    {
      title: 'Share the code',
      body: 'Friends join from any phone or computer browser with the code and a name. Nobody downloads anything.',
    },
    {
      title: 'Pick a theme and a song',
      body: 'The host sets the vibe, or TuneBoxed mode drops a random one each round. Everyone searches for a track that fits. Songs play as 30 second previews, so nobody needs Spotify or Apple Music.',
    },
    {
      title: 'Listen head to head',
      body: 'Two songs play one after the other, in sync for everyone in the room, whether you are around a table or on a call.',
    },
    {
      title: 'Vote, and every vote is a punch',
      body: 'The room votes for the song they liked more. On Twitch, chat types 1 or 2. The winner advances until one song is left standing.',
    },
  ],

  sections: [
    {
      heading: 'Song battle formats',
      paragraphs: [],
      parts: [
        {
          title: 'Bracket',
          paragraphs: [
            'The classic 1v1 song battle. Up to 16 players lock a song in, the songs are seeded into a bracket, and each matchup is decided by the room until one champion song is left. A full bracket takes around 15 to 25 minutes.',
          ],
        },
        {
          title: 'Party',
          paragraphs: [
            'For three or more friends. Each round a genre or vibe drops, everyone except the judge picks a song, and the judge crowns the one they liked most. The judge rotates, and after three rounds the player with the most crowns wins.',
          ],
        },
        {
          title: 'Twitch song battle',
          paragraphs: [
            'Run a bracket on stream and let chat decide. Viewers type 1 or 2 and each message is a punch, with no bot in your channel. Put the board on stream as a tab or an OBS browser source. The [streamer guide](/streamers) has the setup.',
          ],
        },
      ],
    },
    {
      heading: 'Keeping a song battle fair',
      paragraphs: [
        'Pick a theme before anyone picks a song, so the battle is about who answered it best and not only about whose favourite song is loudest. Play the same length of every song, from the same point, so a slow intro is not a handicap. Keep players from voting on their own song: in a TuneBoxed bracket the two players in a matchup sit the vote out.',
      ],
    },
  ] as Section[],

  ideasHeading: 'Song battle ideas',
  ideasIntro: 'Stuck for a theme? Any of these works for a round or a whole bracket.',
  ideas: [
    'Best song of 2016',
    'Songs that hit different at 3am',
    'Best opening track on an album',
    'Gym playlist essentials',
    'Road trip singalong',
    'Best feature verse',
    'Songs your parents played in the car',
    'Best breakup song',
    'Main character energy',
    'Best song under two minutes',
    'Summer anthem',
    'Songs to play at a house party',
    'Best beat drop',
    'Underground artist nobody here knows',
    'Best song from a movie or show',
    'Throwback from middle school',
    'Rainy day songs',
    'Best diss track',
    'Song with the best music video',
    'Best cover of another song',
    'Pregame hype song',
    'Best song in another language',
    'Most underrated song by a famous artist',
    'Sunset drive',
    'Songs that should have been a hit',
    'Best song with a whistle in it',
    'Villain arc',
    'Best TikTok song',
    'Best 2000s R&B',
    'Song you would walk out to in a boxing match',
  ],

  faqHeading: 'Song battle questions',
  faq: [
    {
      q: 'Is TuneBoxed song battle free?',
      a: 'Yes. Hosting and joining a song battle on the web is free, with no account and nothing to download.',
    },
    {
      q: 'How many people can play a song battle?',
      a: 'Party needs three or more players. A bracket holds up to 16 players picking songs, and there is no limit on how many people can vote in Twitch chat.',
    },
    {
      q: 'Do players need Spotify or Apple Music?',
      a: 'No. Songs come from Apple’s public catalogue as 30 second previews, so everyone hears the same clip. You can also paste a SoundCloud or YouTube link to battle a song the catalogue does not have.',
    },
    {
      q: 'Can I play a song battle on Twitch?',
      a: 'Yes. Sign in with Twitch and chat votes by typing 1 or 2. Chat is read anonymously, so there is no bot to add and no permissions to grant.',
    },
    {
      q: 'Is a song battle the same as aux wars or an aux battle?',
      a: 'They are names for the same idea: everyone brings a song and the group votes on the best one. TuneBoxed plays it as a boxing match, where every vote is a punch.',
    },
    {
      q: 'Can I play song battles on iPhone?',
      a: 'Yes. The web game runs in Safari, and the [TuneBoxed iOS app](https://apps.apple.com/us/app/tuneboxed/id6747647968) has Battle Mode plus a daily fight between the day’s top 16 songs.',
    },
  ],

  footer: '[Start a song battle](/battle), read the full [game rules](/rules), or see the [FAQ](/faq).',
};

export type SongBattleCopy = typeof songBattle;
