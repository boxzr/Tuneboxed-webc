/**
 * Website copy. Every other language file is typed against this one, so a
 * missing string is a type error rather than a blank on the page.
 *
 * Inline markup is rendered by <Rich>: [label](/path), **bold**, `code`.
 * Party, Bracket, Classic and TuneBoxed mode are product names and stay in
 * English, matching the in-game screens.
 */
export const en = {
  nav: {
    play: 'Play',
    rules: 'Game rules',
    faq: 'FAQ',
    streamers: 'For streamers',
    winners: 'Winners',
    about: 'About',
    startBattle: 'Start a battle',
    appStore: 'Download on the App Store',
    iosApp: 'iOS app',
    language: 'Language',
    backToSite: 'Back to Site',
  },

  home: {
    title: 'TuneBoxed | Song battles fought as boxing matches',
    headline: 'We turned song battles into',
    headlineEm: 'boxing fights',
    lede: 'Two songs enter the ring. You decide who walks out.',
    sub: 'Everyone picks a track. Two of them square up head to head, and every vote lands a punch until one song is on the canvas. Around a table, in a call, or live on stream. No app, no account.',
    ringTag: 'Live on the stream board',
    howTitle: 'Votes are punches',
    howSub:
      'Other song battle sites give you two bars and a total. A poll tells you who is winning. A fight makes the room feel it.',
    points: [
      {
        title: 'Chat throws the punches',
        body: 'Viewers type 1 or 2 in your Twitch chat. Every vote rocks the other song and drains its health, so the crowd watches the fight turn in real time.',
      },
      {
        title: 'Three in a row is a combo',
        body: 'Back one song three times running and it lands a string of punches. Six is a huge combo, nine a mega combo, and small chats hit harder so every stream gets a real fight.',
      },
      {
        title: 'Shut a song out and it goes down',
        body: 'A close call goes to decision. A song nobody votes for hits the canvas, and the board calls the knockout.',
      },
      {
        title: 'Nothing to install',
        body: 'Share a code, share your screen. No bot in your channel, no OAuth on your account, no download for your viewers.',
      },
    ],
    steps: [
      'Start a room and share the code',
      'Everyone picks a song and dresses their boxer',
      'Songs walk out, the bell rings, and the votes throw the punches',
    ],
    streamersLink: 'Setting it up on stream',
  },

  entry: {
    joinTitle: 'Join the battle',
    hostTitle: 'The Kahoot of song battles',
    joinSub: 'Pick a name the room will recognise and jump in. No app, no account.',
    hostSub: 'Start a room for your group, or drop in with a code.',
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. ninja',
    modeLabel: 'Game mode',
    partyDesc: '3 or more players, a rotating judge, best of 3. Same as the iOS app.',
    bracketDesc: 'Up to 16, head to head. Opens in Classic: one vibe, songs in before you start.',
    codeLabel: 'Room code',
    host: 'Host a battle',
    creating: 'Creating…',
    join: 'Join battle',
    joining: 'Joining…',
    toJoin: 'Have a code? Join a room',
    toHost: 'Host a battle instead',
    signOut: 'Sign out',
    twitch: 'Sign in with Twitch',
    twitchHint: 'Optional. Lets your chat vote by typing in Twitch.',
    finding: 'Looking for your seat…',
    playTitle: 'Play | TuneBoxed',
    joinPageTitle: 'Join a battle | TuneBoxed',
  },

  stats: {
    heading: 'By the numbers',
    battles: 'Battles played',
    songs: 'Songs battled',
    players: 'Players',
    champions: 'Champions',
  },

  rules: {
    title: 'Game rules | TuneBoxed',
    description:
      'How TuneBoxed works: songs walk out as boxers, every vote lands a punch, three in a row is a combo. Party is best of three; Bracket runs up to 16 players.',
    heading: 'Game rules',
    intro: 'Two ways to play in the browser. Same songs, same room code, and the same ring, with a different path to a winner.',
    party: {
      heading: 'Party',
      sub: 'The same Battle Mode as the iOS app. Built for a group around a table or on a call.',
      steps: [
        {
          title: 'Start a Party room',
          body: 'You get a five-letter code. Share it in a group chat or read it out. Everyone joins in their browser. No app, no account.',
        },
        {
          title: 'Everyone picks a song',
          body: 'Three or more players. Each round, everyone except the judge locks in a track, with 90 seconds on the clock by default. The host can give more time or turn the clock off. Miss it and you are out of the round. While you wait, dress your fighter in the locker room.',
        },
        {
          title: 'The songs play together',
          body: 'Each pick plays for 30 seconds by default, in sync for everyone in the room at the same moment. The host can shorten it. When exactly two songs are in, the round goes to the ring: each song is its fighter’s walkout.',
        },
        {
          title: 'A rotating judge crowns a winner',
          body: 'One player sits out the pick and chooses the song they liked more. In the ring, the judge crowns a corner. The judge role moves each round.',
        },
        {
          title: 'Best of three',
          body: 'Three rounds, then the player with the most crowns wins.',
        },
      ],
    },
    bracket: {
      heading: 'Bracket',
      sub: 'Head to head until one song is left. The format a stream can put on screen. Classic is the default: one vibe, songs in first. Switch to TuneBoxed mode in game settings if you want a fresh random vibe each matchup and a live pick clock.',
      steps: [
        {
          title: 'Start a Bracket room',
          body: 'Up to 16 players. Share the code however suits you, including on a stream. Bracket opens in Classic.',
        },
        {
          title: 'Pick one vibe, then lock songs in',
          body: 'The host names the vibe for the whole game — sunset, 2016 rap, whatever they want. Players submit before anything starts. There is no clock and nothing is live yet, so nobody is rushed.',
        },
        {
          title: 'Two songs walk out',
          body: 'Every matchup is a boxing match. Each fighter walks out to their song, one corner then the other, for 30 seconds by default and in sync for everyone in the room. The host can change the clip length. Those are the songs people locked in, not a new pick each round.',
        },
        {
          title: 'The room throws the punches',
          body: 'When both songs have played, the bell rings and voting opens. Everyone in the room picks the track they liked more, except the two in the matchup. If the host is on Twitch, chat votes too by typing 1 or 2. Every vote is a punch.',
        },
        {
          title: 'The winner advances',
          body: 'The song with more votes moves up the bracket, by knockout or on the judges’ decision. A tie, or no votes at all, is a coin flip. Repeat until one track is left standing.',
        },
      ],
    },
    sections: [
      {
        heading: 'The fight',
        paragraphs: [
          'Every head-to-head is fought in a 3D ring by two music-note boxers, one in the blue corner and one in the orange. Each walks out to their own song with an entrance picked at random from five, so no two fights open the same way. Everyone else in the room is in the crowd, and the referee calls it.',
        ],
        parts: [
          {
            title: 'Votes are punches',
            paragraphs: [
              'Once both songs have played, the bell goes and every vote lands a punch on the other song. The health bars at the top follow the vote: the further one song pulls ahead, the more the other one’s bar drains.',
            ],
          },
          {
            title: 'Combos',
            paragraphs: [
              'Three votes in a row for the same song, with none for the other, is a combo: a string of punches instead of one. Keep the run going and it grows. Six in a row is a huge combo and nine is a mega combo. A single vote for the other corner breaks the streak.',
            ],
          },
          {
            title: 'Small rooms hit harder',
            paragraphs: [
              'A quiet chat should not feel like a quiet fight. When only a few votes are coming in, each one counts for more on screen: with five or fewer in the last 15 seconds, one vote is a full combo, and up to twelve doubles it. This only changes how hard the punches land. The winner is always decided by the real vote count.',
            ],
          },
          {
            title: 'Knockout or decision',
            paragraphs: [
              'A song nobody votes for, once at least five votes are in, has its bar emptied and goes down: that is a knockout. Anything closer goes to a decision, and the song with more votes takes it.',
            ],
          },
          {
            title: 'Your fighter',
            paragraphs: [
              'Dress your boxer in the locker room while the room locks songs in: body colour, note style, flag, trunks, gloves, sneakers and build. It is saved to you for the rest of the game. If you skip it you still get a fighter, styled from your name.',
            ],
          },
        ],
      },
      {
        heading: 'What counts as a vote in Twitch chat',
        paragraphs: [
          'Only a message that is exactly the number counts. Typing **1** votes for the first song; typing “1 is better” does not. Chat during a battle is full of digits, and matching loosely would quietly miscount the result.',
          'Votes are counted while your hosting tab is open. If you close it mid-vote, chat votes stop being counted until you reopen it.',
        ],
      },
      {
        heading: 'Odd numbers of players',
        paragraphs: [
          'A bracket needs pairs. When the count is odd, byes are spread across the first stage rather than piled at the end, so at most one player per matchup sits it out. A bye moves you to the next stage without playing. In TuneBoxed mode you pick again there; in Classic you keep the song you locked in.',
          'If you ever reach a matchup with nobody opposite you, you take it without a round rather than waiting for an opponent who is never coming.',
        ],
      },
      {
        heading: 'Missing the clock',
        paragraphs: [
          'When the pick timer hits zero the round closes on whatever is in. If only one person got a song in, they take the round: turning up beats not turning up. If nobody did, the host can put more time on the clock.',
        ],
      },
      {
        heading: 'Where songs come from',
        paragraphs: [
          'Search covers Apple’s public music catalogue, and each result plays as a 30 second clip. Nobody needs a Spotify or Apple Music subscription, because everyone in the room plays the same preview rather than a stream only some of them can reach.',
          'Switch search to music videos to battle with the video instead of the track. It runs on the same clock and the same clip length, so the room watches it together rather than only hearing it.',
          'You can also paste a SoundCloud or YouTube link instead of searching, which is how to battle a song the Apple catalogue does not carry. Those play in SoundCloud’s and YouTube’s own players, so they stay on screen during the matchup. They also start a beat less precisely than a preview does, since the player has to load first and YouTube may run an ad, so expect a second or two of slack rather than the exact sync you get from search.',
        ],
      },
    ] as Section[],
    footer: '[Start a battle](/battle) or read the [FAQ](/faq).',
  },

  faq: {
    title: 'FAQ | TuneBoxed',
    description:
      'Answers about TuneBoxed: how the boxing match and combos work, joining from a browser, chat voting, putting the fight on stream, and how long a bracket takes.',
    heading: 'FAQ',
    intro: 'Questions that come up when running a battle.',
    items: [
      {
        q: 'How does the boxing match work?',
        a: 'Every head-to-head is a fight between two music-note boxers in a 3D ring. Each walks out to their song, one corner then the other, with an entrance picked at random from five. When both songs have played the bell rings, and every vote lands a punch on the other song and drains its health bar. The song with more votes wins: by knockout if the other got none, on a decision if it was closer.',
      },
      {
        q: 'What is a combo?',
        a: 'Three votes in a row for the same song, with none for the other in between, is a combo: a string of punches instead of a single one. Six in a row is a huge combo and nine is a mega combo. One vote for the other corner breaks the streak.',
      },
      {
        q: 'My chat is small. Will the fights still look good?',
        a: 'Yes. When only a few votes are coming in, each one hits harder on screen. With five or fewer votes in the last 15 seconds, a single vote is a full combo, and up to twelve each vote counts double. It only changes the punches. The winner is always the song with more real votes.',
      },
      {
        q: 'Can I customise my boxer?',
        a: 'Yes. While the room locks songs in, the locker room lets you pick your body colour, note style, flag, trunks, gloves, sneakers and build, and throw a few jabs to see how it looks. Your fighter keeps that look for the rest of the game. Skip it and you get one styled from your name.',
      },
      {
        q: 'Which browsers does it work in?',
        a: 'Any current browser on a computer or phone: Chrome, Edge, Firefox, Safari, and Chromium browsers like Brave and Opera, on Windows, Mac, Linux, iOS and Android. The ring needs WebGL, which they all have unless it has been switched off. In OBS, leave browser source hardware acceleration on, which is the default.',
      },
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
        a: 'Yes. Every room has a board at its own address that shows the whole thing: the walkouts, the fight, the health bars, combos and the live vote counts. Open it in another tab and share that as your stream — you can reveal songs and advance rounds from that screen, and the buttons fade when you stop moving. Or paste the same URL into OBS, Streamlabs or anything else with a Browser Source. No broadcasting software is required.',
      },
      {
        q: 'How long does a battle take?',
        a: 'In TuneBoxed mode players get 90 seconds to pick by default, and each song plays for 30 seconds. The host can change both in game settings. Classic has no pick clock — songs go in before the host starts. A full 16 player bracket is four stages, so budget somewhere around 15 to 25 minutes depending on how long you leave voting open.',
      },
      {
        q: 'What is Classic vs TuneBoxed mode?',
        a: 'Classic is the preset for a bracket. The host picks one vibe for the whole game, players lock a song in the lobby with no timer, and those songs are what the bracket plays. TuneBoxed mode is the live game: a fresh random vibe each round and a pick clock the host sets (90 seconds by default). Switch in game settings.',
      },
      {
        q: 'Where do the songs come from?',
        a: 'Players search Apple’s public music catalogue, and each track plays as a 30 second preview. Nobody needs a Spotify or Apple Music subscription.',
      },
      {
        q: 'Can I use SoundCloud or YouTube?',
        a: 'Yes. Instead of searching, paste a SoundCloud or YouTube link, which is how to battle something the Apple catalogue does not carry. Those tracks play in SoundCloud’s and YouTube’s own players rather than as a preview, so the player stays visible during the matchup and the start is a second or two less tight, particularly if YouTube runs an ad first.',
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
    ],
    footer:
      'Still stuck? The [game rules](/rules) walk through a battle step by step, and the [streamer setup guide](/streamers) covers putting it on stream.',
  },

  streamers: {
    title: 'For streamers | TuneBoxed',
    description:
      'Put a TuneBoxed song battle on Twitch or TikTok: songs walk out as boxers and chat types 1 or 2 to throw punches. Share the board as a tab or browser source.',
    heading: 'For streamers',
    intro: 'Everything you need to put a song battle on stream, and what it does and does not need access to.',
    setupHeading: 'Setting up',
    steps: [
      {
        title: 'Sign in with Twitch',
        paragraphs: [
          'This is what tells us which channel to read votes from, and it puts your channel name and avatar on the board.',
        ],
      },
      {
        title: 'Start a room',
        paragraphs: ['You get a five-letter code and a join link. Read the code out or drop the link in chat.'],
      },
      {
        title: 'Put the board on stream',
        paragraphs: [
          'Every room has a board at its own address, built to be the thing your audience looks at. Each matchup plays out as a full boxing match: the walkouts, the bell, the fight, health bars, combos and live vote counts. Open it in another tab and run the battle from there — reveal songs and advance rounds without clicking back to the room.',
          'No OBS? Share that board tab as your stream. Your buttons fade when you stop moving, so they stay off camera. This works on every platform and needs nothing installed.',
          'Have OBS, Streamlabs, or anything with a Browser Source? Paste the same URL in and set it to 1920 by 1080. A Browser Source has no login, so it cannot show your buttons. It is a full scene rather than a transparent strip, so it does not need anything behind it.',
          'Songs do not play on the board until you send audio there. In Game settings, set “Sound comes from” to Stream board, then tap the board once so the browser will play. That is also where the volume slider and song levelling live.',
        ],
      },
      {
        title: 'Tell chat to type 1 or 2',
        paragraphs: [
          'The board shows both songs numbered, with a live count. Chat votes by typing the number on its own, and every vote is a punch. Voting opens when the bell rings after both walkouts.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Getting chat to fight',
        paragraphs: [
          'The fight rewards a chat that pulls together. Three votes in a row for one song is a combo, six is a huge combo and nine is a mega combo, and the board calls each one out with the streak. A vote for the other song breaks it, so a back-and-forth chat gets a real slugfest.',
          'Smaller channels are not left with a slow fight. When only a handful of votes are coming in, each one hits harder on screen: with five or fewer in the last 15 seconds, one vote is a full combo. The board shows the multiplier while it is on. It never changes the result, which always goes to the song with more real votes.',
          'A song that gets no votes at all, once five are in, is knocked out. Anything closer is a decision.',
        ],
      },
      {
        heading: 'Checking the board before you go live',
        paragraphs: [
          '[tuneboxed.com/tv/DEMO1?demo=1](/tv/DEMO1?demo=1) runs a sample fight with made-up songs and chat, so you can size and place it without needing a battle in progress. Any room code works with `?demo=1` on the end.',
          'The ring is 3D and runs in any current browser, including OBS and Streamlabs browser sources on Windows and Mac. If the ring stays blank in OBS, check that browser source hardware acceleration is on under Settings, Advanced.',
        ],
      },
      {
        heading: 'What this can and cannot do to your channel',
        paragraphs: [
          'Chat is read anonymously, the same way any viewer’s browser reads it. That means no bot account joins your chat, you grant no moderator or chat permissions, and there is no mechanism by which TuneBoxed could post a message as you. Reading is the only thing it does.',
          'The trade for not running a server is that counting happens in your hosting tab. Votes accumulate only while that tab is open, so keep it open for the length of the battle.',
        ],
      },
      {
        heading: 'Names and song titles',
        paragraphs: [
          'Display names, and titles from SoundCloud or YouTube, are blocked if they use slurs. Ordinary swearing is allowed. Catalogue tracks from Apple Music are not re-filtered, because those titles are already on a store.',
          'Winners are only published to the [public winners board](/winners) if you choose to publish them, and you can publish the winning song without the winner’s name.',
        ],
      },
      {
        heading: 'TikTok and other platforms',
        paragraphs: [
          'The battle itself works anywhere you can share a link and screen share a tab, so TikTok, Kick, YouTube and Discord are all fine. Chat voting is Twitch only for now, because it relies on reading Twitch chat. Everywhere else the players in the room vote instead, which is also how it works when nobody is streaming at all.',
        ],
      },
    ] as Section[],
    footer: '[Start a battle](/battle) or read the [game rules](/rules).',
  },

  about: {
    title: 'About | TuneBoxed',
    description:
      'TuneBoxed is a music game: song battles fought as 3D boxing matches in the browser, where every vote lands a punch, and a daily music feed on iOS.',
    heading: 'About TuneBoxed',
    intro: 'A music game about the one thing every group argues over: whose taste is better.',
    battlesHeading: 'Song battles, fought as boxing matches',
    battles: [
      'Someone starts a room, everyone else joins from a browser with a code, and each player picks a song. Then two songs step into the ring. Each one is a cartoon music-note boxer that walks out to its own track, and once the bell rings every vote lands a punch. Three in a row is a combo. Shut a song out and it hits the canvas. The bracket runs until a single song is left standing.',
      'A poll tells you who is winning. A fight makes the room feel it. Everyone dresses their own boxer in the locker room, the rest of the room fills the crowd, and a small chat still gets a real fight because each vote hits harder on screen when fewer are coming in.',
      'It is built to be watched together. Songs play in sync so everyone hears the same thing at the same moment, and every room has a board you can put on a TV, a projector or a stream. If you are on Twitch, voting can happen in the chat that is already there rather than on a second screen.',
    ],
    iosHeading: 'The iOS app',
    ios: 'TuneBoxed started on iPhone and still lives there. Every day brings a new genre, you post the song that fits it best, and the community votes. There are battles too, including Bar for Bar, plus ranks and matching with people who post the same things you do.',
    whoHeading: 'Who makes it',
    who: 'TuneBoxed is built by Aura Brand LLC.',
    footer: '[Start a battle](/battle), read the [game rules](/rules), or see the [winners board](/winners).',
  },

  winners: {
    title: 'Winners | TuneBoxed',
    description: 'Songs that won a TuneBoxed bracket. Published by the hosts who ran the battles.',
    heading: 'Winners',
    intro: 'Songs that made it through a whole bracket. Hosts choose whether a battle lands here.',
    failed: 'The winners board could not be loaded right now. Try again in a moment.',
    loading: 'Loading the board…',
    empty: 'No published winners yet. Win a bracket and you can put the song up here. [Start a battle](/battle).',
    pickedBy: 'picked by {name}',
    room: '{name}’s room',
    players: '{count} players',
    footer: 'Read the [game rules](/rules) or [start a battle](/battle).',
  },
};

export interface Section {
  heading: string;
  paragraphs: string[];
  parts?: { title: string; paragraphs: string[] }[];
}

export type Copy = typeof en;
export default en;
