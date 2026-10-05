import type { Copy } from './en';

const de: Copy = {
  nav: {
    play: 'Spielen',
    rules: 'Spielregeln',
    faq: 'FAQ',
    streamers: 'Für Streamer',
    winners: 'Gewinner',
    about: 'Über uns',
    startBattle: 'Battle starten',
    appStore: 'Laden im App Store',
    iosApp: 'iOS-App',
    language: 'Sprache',
    backToSite: 'Zurück zur Website',
  },

  home: {
    title: 'TuneBoxed | Song-Battles als Boxkämpfe',
    headline: 'Wir haben Song-Battles in',
    headlineEm: 'Boxkämpfe verwandelt',
    lede: 'Zwei Songs steigen in den Ring. Du entscheidest, wer ihn als Sieger verlässt.',
    sub: 'Alle wählen einen Track. Zwei davon treten direkt gegeneinander an, und jede Stimme ist ein Schlag – bis ein Song auf die Bretter geht. Am Tisch, im Call oder live im Stream. Keine App, kein Account.',
    ringTag: 'Live auf dem Stream-Board',
    howTitle: 'Stimmen sind Schläge',
    howSub:
      'Andere Song-Battle-Seiten zeigen dir zwei Balken und eine Summe. Eine Umfrage sagt dir, wer vorne liegt. Ein Kampf lässt es den ganzen Raum spüren.',
    points: [
      {
        title: 'Der Chat teilt die Schläge aus',
        body: 'Deine Zuschauer tippen 1 oder 2 in deinen Twitch-Chat. Jede Stimme erschüttert den anderen Song und zieht ihm Lebensenergie ab – so sieht die Crowd live, wie der Kampf kippt.',
      },
      {
        title: 'Drei in Folge sind eine Combo',
        body: 'Stimm dreimal hintereinander für denselben Song, und er landet eine ganze Schlagserie. Sechs sind eine riesige Combo, neun eine Mega-Combo – und kleine Chats schlagen härter zu, damit jeder Stream einen echten Fight bekommt.',
      },
      {
        title: 'Kriegt ein Song keine Stimme, geht er k.o.',
        body: 'Ein knappes Duell geht in die Punktwertung. Ein Song, für den niemand stimmt, geht auf die Bretter, und das Board ruft den Knockout aus.',
      },
      {
        title: 'Nichts zu installieren',
        body: 'Code teilen, Bildschirm teilen. Kein Bot in deinem Kanal, kein OAuth auf deinem Account, kein Download für deine Zuschauer.',
      },
    ],
    steps: [
      'Raum starten und Code teilen',
      'Alle wählen einen Song und stylen ihren Boxer',
      'Die Songs laufen ein, der Gong ertönt und die Stimmen teilen die Schläge aus',
    ],
    streamersLink: 'So richtest du es im Stream ein',
  },

  entry: {
    joinTitle: 'Steig ins Battle ein',
    hostTitle: 'Das Kahoot für Song-Battles',
    joinSub: 'Wähl einen Namen, den die Runde erkennt, und spring rein. Keine App, kein Account.',
    hostSub: 'Starte einen Raum für deine Gruppe oder steig mit einem Code ein.',
    nameLabel: 'Dein Name',
    namePlaceholder: 'z. B. ninja',
    modeLabel: 'Spielmodus',
    partyDesc: 'Ab 3 Spielern, wechselnde Jury, Best of 3. Genau wie in der iOS-App.',
    bracketDesc: 'Bis zu 16, Kopf an Kopf. Startet in Classic: ein Vibe, Songs werden vor dem Start eingereicht.',
    codeLabel: 'Raumcode',
    host: 'Battle hosten',
    creating: 'Wird erstellt…',
    join: 'Battle beitreten',
    joining: 'Trete bei…',
    toJoin: 'Hast du einen Code? Raum beitreten',
    toHost: 'Lieber selbst ein Battle hosten',
    signOut: 'Abmelden',
    twitch: 'Mit Twitch anmelden',
    twitchHint: 'Optional. Damit kann dein Chat per Twitch-Nachricht abstimmen.',
    finding: 'Suche deinen Platz…',
    playTitle: 'Spielen | TuneBoxed',
    joinPageTitle: 'Battle beitreten | TuneBoxed',
  },

  stats: {
    heading: 'In Zahlen',
    battles: 'Gespielte Battles',
    songs: 'Songs im Ring',
    players: 'Spieler',
    champions: 'Champions',
  },

  rules: {
    title: 'Spielregeln | TuneBoxed',
    description:
      'So funktioniert TuneBoxed: Songs laufen als Boxer ein, jede Stimme ist ein Schlag, drei in Folge sind eine Combo. Party ist Best of 3, Bracket bis 16 Spieler.',
    heading: 'Spielregeln',
    intro: 'Zwei Arten, im Browser zu spielen. Dieselben Songs, derselbe Raumcode und derselbe Ring – nur ein anderer Weg zum Sieg.',
    party: {
      heading: 'Party',
      sub: 'Derselbe Battle Mode wie in der iOS-App. Gemacht für eine Gruppe am Tisch oder im Call.',
      steps: [
        {
          title: 'Party-Raum starten',
          body: 'Du bekommst einen fünfstelligen Code aus Buchstaben. Teil ihn im Gruppenchat oder lies ihn vor. Alle treten im Browser bei. Keine App, kein Account.',
        },
        {
          title: 'Alle wählen einen Song',
          body: 'Ab drei Spielern. In jeder Runde legen alle außer der Jury einen Track fest – standardmäßig mit 90 Sekunden auf der Uhr. Der Host kann mehr Zeit geben oder die Uhr ausschalten. Wer es nicht schafft, setzt die Runde aus. Während du wartest, stylst du deinen Fighter in der Umkleide.',
        },
        {
          title: 'Die Songs laufen gemeinsam',
          body: 'Jeder Pick läuft standardmäßig 30 Sekunden – synchron für alle im Raum im selben Moment. Der Host kann das verkürzen. Sind genau zwei Songs im Rennen, geht die Runde in den Ring: Jeder Song ist der Einlaufsong seines Fighters.',
        },
        {
          title: 'Eine wechselnde Jury kürt den Sieger',
          body: 'Ein Spieler setzt beim Picken aus und wählt den Song, der ihm besser gefallen hat. Im Ring krönt die Jury eine Ecke. Die Jury-Rolle wechselt jede Runde.',
        },
        {
          title: 'Best of 3',
          body: 'Drei Runden, danach gewinnt, wer die meisten Kronen hat.',
        },
      ],
    },
    bracket: {
      heading: 'Bracket',
      sub: 'Kopf an Kopf, bis nur noch ein Song übrig ist. Das Format, das ein Stream auf den Bildschirm bringen kann. Standard ist Classic: ein Vibe, Songs vorab. Wechsel in den Spieleinstellungen in den TuneBoxed-Modus, wenn du bei jedem Duell einen neuen zufälligen Vibe und eine Live-Pick-Uhr willst.',
      steps: [
        {
          title: 'Bracket-Raum starten',
          body: 'Bis zu 16 Spieler. Teil den Code, wie es für dich passt – auch im Stream. Bracket startet in Classic.',
        },
        {
          title: 'Einen Vibe wählen, dann Songs festlegen',
          body: 'Der Host gibt den Vibe für das ganze Spiel vor – Sonnenuntergang, Rap aus 2016, was auch immer. Die Spieler reichen ihre Songs ein, bevor es losgeht. Es gibt keine Uhr und noch läuft nichts live, also muss sich niemand hetzen.',
        },
        {
          title: 'Zwei Songs laufen ein',
          body: 'Jedes Duell ist ein Boxkampf. Jeder Fighter läuft zu seinem Song ein, erst die eine Ecke, dann die andere – standardmäßig 30 Sekunden lang und synchron für alle im Raum. Der Host kann die Cliplänge ändern. Es sind die Songs, die vorab festgelegt wurden, kein neuer Pick pro Runde.',
        },
        {
          title: 'Der Raum teilt die Schläge aus',
          body: 'Wenn beide Songs gelaufen sind, ertönt der Gong und die Abstimmung startet. Alle im Raum wählen den Track, der ihnen besser gefallen hat – außer den beiden im Duell. Ist der Host auf Twitch, stimmt auch der Chat ab, indem er 1 oder 2 tippt. Jede Stimme ist ein Schlag.',
        },
        {
          title: 'Der Sieger kommt weiter',
          body: 'Der Song mit mehr Stimmen steigt im Bracket auf, per Knockout oder nach Punkten. Bei Gleichstand oder ganz ohne Stimmen entscheidet ein Münzwurf. Das geht so weiter, bis nur noch ein Track steht.',
        },
      ],
    },
    sections: [
      {
        heading: 'Der Kampf',
        paragraphs: [
          'Jedes Duell wird in einem 3D-Ring von zwei Musiknoten-Boxern ausgetragen, einer in der blauen und einer in der orangen Ecke. Jeder läuft zu seinem eigenen Song ein, mit einem Auftritt, der zufällig aus fünf ausgewählt wird – so beginnt kein Kampf wie der andere. Alle anderen im Raum sind Teil der Crowd, und der Ringrichter leitet den Fight.',
        ],
        parts: [
          {
            title: 'Stimmen sind Schläge',
            paragraphs: [
              'Sobald beide Songs gelaufen sind, ertönt der Gong, und jede Stimme landet einen Schlag auf dem anderen Song. Die Lebensbalken oben folgen der Abstimmung: Je weiter ein Song vorne liegt, desto stärker leert sich der Balken des anderen.',
            ],
          },
          {
            title: 'Combos',
            paragraphs: [
              'Drei Stimmen in Folge für denselben Song, ohne eine für den anderen, sind eine Combo: eine Schlagserie statt eines einzelnen Treffers. Hält die Serie an, wächst sie. Sechs in Folge sind eine riesige Combo, neun eine Mega-Combo. Eine einzige Stimme für die andere Ecke unterbricht die Serie.',
            ],
          },
          {
            title: 'Kleine Runden schlagen härter zu',
            paragraphs: [
              'Ein ruhiger Chat soll sich nicht nach einem lahmen Kampf anfühlen. Wenn nur wenige Stimmen reinkommen, zählt jede auf dem Bildschirm mehr: Bei fünf oder weniger in den letzten 15 Sekunden ist eine Stimme eine volle Combo, bei bis zu zwölf zählt sie doppelt. Das ändert nur, wie hart die Schläge einschlagen. Der Sieger wird immer nach der echten Stimmenzahl entschieden.',
            ],
          },
          {
            title: 'Knockout oder Punktsieg',
            paragraphs: [
              'Bekommt ein Song keine einzige Stimme, sobald mindestens fünf abgegeben wurden, leert sich sein Balken und er geht zu Boden: Das ist ein Knockout. Alles Knappere geht in die Punktwertung, und der Song mit mehr Stimmen gewinnt.',
            ],
          },
          {
            title: 'Dein Fighter',
            paragraphs: [
              'Style deinen Boxer in der Umkleide, während der Raum Songs festlegt: Körperfarbe, Notenstil, Flagge, Hose, Handschuhe, Sneaker und Statur. Der Look bleibt dir für den Rest des Spiels. Überspringst du das, bekommst du trotzdem einen Fighter – gestylt nach deinem Namen.',
            ],
          },
        ],
      },
      {
        heading: 'Was im Twitch-Chat als Stimme zählt',
        paragraphs: [
          'Nur eine Nachricht, die exakt aus der Zahl besteht, zählt. Wer **1** tippt, stimmt für den ersten Song; „1 ist besser“ zählt nicht. Der Chat ist während eines Battles voller Ziffern, und eine lockere Erkennung würde das Ergebnis unbemerkt verfälschen.',
          'Stimmen werden gezählt, solange dein Host-Tab offen ist. Schließt du ihn mitten in der Abstimmung, werden Chat-Stimmen erst wieder gezählt, wenn du ihn erneut öffnest.',
        ],
      },
      {
        heading: 'Ungerade Spielerzahl',
        paragraphs: [
          'Ein Bracket braucht Paare. Bei einer ungeraden Zahl werden Freilose über die erste Stufe verteilt, statt sich am Ende zu stapeln – so setzt pro Duell höchstens ein Spieler aus. Mit einem Freilos kommst du ohne Kampf in die nächste Stufe. Im TuneBoxed-Modus wählst du dort neu; in Classic behältst du deinen festgelegten Song.',
          'Landest du in einem Duell ohne Gegner, gewinnst du es ohne Runde, statt auf jemanden zu warten, der nie kommt.',
        ],
      },
      {
        heading: 'Wenn die Zeit abläuft',
        paragraphs: [
          'Steht der Pick-Timer auf null, schließt die Runde mit dem, was eingereicht wurde. Hat nur eine Person einen Song abgegeben, gewinnt sie die Runde: Wer da ist, schlägt den, der fehlt. Hat niemand etwas eingereicht, kann der Host mehr Zeit auf die Uhr packen.',
        ],
      },
      {
        heading: 'Woher die Songs kommen',
        paragraphs: [
          'Die Suche durchsucht Apples öffentlichen Musikkatalog, und jedes Ergebnis läuft als 30-Sekunden-Clip. Niemand braucht ein Spotify- oder Apple-Music-Abo, denn alle im Raum hören dieselbe Vorschau statt eines Streams, auf den nur manche Zugriff haben.',
          'Stell die Suche auf Musikvideos um, um mit dem Video statt dem Track anzutreten. Es läuft mit derselben Uhr und derselben Cliplänge, sodass der Raum es gemeinsam sieht, statt es nur zu hören.',
          'Statt zu suchen, kannst du auch einen SoundCloud- oder YouTube-Link einfügen – so trittst du mit Songs an, die es im Apple-Katalog nicht gibt. Die laufen in den eigenen Playern von SoundCloud und YouTube und bleiben daher während des Duells sichtbar. Sie starten außerdem etwas ungenauer als eine Vorschau, weil der Player erst laden muss und YouTube eventuell Werbung zeigt. Rechne also mit ein, zwei Sekunden Versatz statt der exakten Synchronität, die du über die Suche bekommst.',
        ],
      },
    ],
    footer: '[Starte ein Battle](/battle) oder lies die [FAQ](/faq).',
  },

  faq: {
    title: 'FAQ | TuneBoxed',
    description:
      'Antworten zu TuneBoxed: wie Boxkampf und Combos funktionieren, Beitritt per Browser, Chat-Voting, der Fight im Stream und wie lange ein Bracket dauert.',
    heading: 'FAQ',
    intro: 'Fragen, die beim Veranstalten eines Battles aufkommen.',
    items: [
      {
        q: 'Wie funktioniert der Boxkampf?',
        a: 'Jedes Duell ist ein Kampf zwischen zwei Musiknoten-Boxern in einem 3D-Ring. Jeder läuft zu seinem Song ein, erst die eine Ecke, dann die andere, mit einem Auftritt, der zufällig aus fünf ausgewählt wird. Wenn beide Songs gelaufen sind, ertönt der Gong, und jede Stimme landet einen Schlag auf dem anderen Song und leert seinen Lebensbalken. Der Song mit mehr Stimmen gewinnt: per Knockout, wenn der andere keine bekommen hat, nach Punkten, wenn es knapper war.',
      },
      {
        q: 'Was ist eine Combo?',
        a: 'Drei Stimmen in Folge für denselben Song, ohne eine für den anderen dazwischen, sind eine Combo: eine Schlagserie statt eines einzelnen Treffers. Sechs in Folge sind eine riesige Combo, neun eine Mega-Combo. Eine Stimme für die andere Ecke unterbricht die Serie.',
      },
      {
        q: 'Mein Chat ist klein. Sehen die Kämpfe trotzdem gut aus?',
        a: 'Ja. Wenn nur wenige Stimmen reinkommen, schlägt jede auf dem Bildschirm härter zu. Bei fünf oder weniger Stimmen in den letzten 15 Sekunden ist eine einzige Stimme eine volle Combo, bei bis zu zwölf zählt jede Stimme doppelt. Das ändert nur die Schläge. Sieger ist immer der Song mit mehr echten Stimmen.',
      },
      {
        q: 'Kann ich meinen Boxer anpassen?',
        a: 'Ja. Während der Raum Songs festlegt, kannst du in der Umkleide Körperfarbe, Notenstil, Flagge, Hose, Handschuhe, Sneaker und Statur wählen – und ein paar Jabs schlagen, um zu sehen, wie es aussieht. Dein Fighter behält diesen Look für den Rest des Spiels. Überspringst du das, bekommst du einen, der nach deinem Namen gestylt ist.',
      },
      {
        q: 'In welchen Browsern funktioniert es?',
        a: 'In jedem aktuellen Browser auf Computer oder Handy: Chrome, Edge, Firefox, Safari und Chromium-Browser wie Brave und Opera, unter Windows, Mac, Linux, iOS und Android. Der Ring braucht WebGL, das alle haben, sofern es nicht abgeschaltet wurde. Lass in OBS die Hardwarebeschleunigung für die Browser Source eingeschaltet – das ist der Standard.',
      },
      {
        q: 'Müssen meine Zuschauer etwas herunterladen?',
        a: 'Nein. Sie öffnen den Link in ihrem Browser, geben einen Namen ein und sind dabei. Es gibt keine App zu installieren und keinen Account zu erstellen.',
      },
      {
        q: 'Brauche ich einen Twitch-Account?',
        a: 'Nur, wenn dein Chat abstimmen soll. Du kannst ein Battle auch ohne Anmeldung starten – dann stimmen stattdessen die Spieler im Raum ab. Über die Twitch-Anmeldung wissen wir, aus welchem Kanal wir die Stimmen lesen sollen.',
      },
      {
        q: 'Wie funktioniert das Voting im Twitch-Chat?',
        a: 'Während der Abstimmung tippen deine Zuschauer 1 oder 2 für den Song, den sie besser finden. Jeder Twitch-Account hat pro Duell eine Stimme, und erneutes Abstimmen verschiebt diese Stimme, statt eine zweite hinzuzufügen.',
      },
      {
        q: 'Brauche ich dafür einen Bot im Chat?',
        a: 'Nein. Der Chat wird anonym gelesen, es gibt also keinen Bot-Account hinzuzufügen, keine Mod-Rechte zu vergeben und keine Möglichkeit für TuneBoxed, in deinem Namen zu posten. Es wird ausschließlich gelesen.',
      },
      {
        q: 'Muss ich den Tab offen lassen?',
        a: 'Ja. Chat-Stimmen werden in deinem Host-Tab gezählt, sie sammeln sich also nur, solange er offen ist. Schließt du ihn mitten in der Abstimmung, stoppt die Zählung, bis du ihn wieder öffnest.',
      },
      {
        q: 'Wie viele Leute können mitspielen?',
        a: 'Ein Bracket fasst bis zu 16 Spieler, die Songs auswählen. Wie viele Leute im Chat abstimmen, ist unbegrenzt.',
      },
      {
        q: 'Kann ich das Battle in meinen Stream bringen?',
        a: 'Ja. Jeder Raum hat ein Board unter einer eigenen Adresse, das alles zeigt: die Einläufe, den Kampf, die Lebensbalken, Combos und die Live-Stimmenzahlen. Öffne es in einem anderen Tab und teile diesen als deinen Stream – von dort aus kannst du Songs aufdecken und Runden weiterschalten, und die Buttons blenden sich aus, sobald du die Maus nicht bewegst. Oder füge dieselbe URL in OBS, Streamlabs oder jedes andere Tool mit Browser Source ein. Streaming-Software ist nicht erforderlich.',
      },
      {
        q: 'Wie lange dauert ein Battle?',
        a: 'Im TuneBoxed-Modus haben die Spieler standardmäßig 90 Sekunden zum Picken, und jeder Song läuft 30 Sekunden. Der Host kann beides in den Spieleinstellungen ändern. Classic hat keine Pick-Uhr – die Songs werden eingereicht, bevor der Host startet. Ein volles Bracket mit 16 Spielern hat vier Stufen, plane also etwa 15 bis 25 Minuten ein, je nachdem, wie lange du die Abstimmung offen lässt.',
      },
      {
        q: 'Was ist der Unterschied zwischen Classic und TuneBoxed-Modus?',
        a: 'Classic ist die Voreinstellung für ein Bracket. Der Host wählt einen Vibe für das ganze Spiel, die Spieler legen ohne Timer in der Lobby einen Song fest, und genau diese Songs spielt das Bracket. Der TuneBoxed-Modus ist das Live-Spiel: jede Runde ein neuer zufälliger Vibe und eine Pick-Uhr, die der Host einstellt (standardmäßig 90 Sekunden). Wechseln kannst du in den Spieleinstellungen.',
      },
      {
        q: 'Woher kommen die Songs?',
        a: 'Die Spieler durchsuchen Apples öffentlichen Musikkatalog, und jeder Track läuft als 30-Sekunden-Vorschau. Niemand braucht ein Spotify- oder Apple-Music-Abo.',
      },
      {
        q: 'Kann ich SoundCloud oder YouTube nutzen?',
        a: 'Ja. Statt zu suchen, fügst du einen SoundCloud- oder YouTube-Link ein – so trittst du mit Songs an, die es im Apple-Katalog nicht gibt. Diese Tracks laufen in den eigenen Playern von SoundCloud und YouTube statt als Vorschau. Der Player bleibt deshalb während des Duells sichtbar, und der Start ist ein, zwei Sekunden weniger präzise, besonders wenn YouTube vorher Werbung zeigt.',
      },
      {
        q: 'Ist es kostenlos?',
        a: 'Ja. Ein Battle im Web zu hosten und beizutreten ist kostenlos.',
      },
      {
        q: 'Was passiert, wenn jemand die Verbindung verliert?',
        a: 'Der Platz wird freigehalten, und die Person kann über denselben Link wieder beitreten. Kommt sie nicht zurück, geht das Battle ohne sie weiter.',
      },
      {
        q: 'Ist das dasselbe wie die iOS-App?',
        a: 'Es nutzt dieselben Server. Party im Web ist derselbe Battle Mode wie in der iOS-App: Best of 3, wechselnde Jury. Bracket ist das Streamer-Format. Die iOS-App hat außerdem einen täglichen Musik-Feed, den die Website nicht hat.',
      },
    ],
    footer:
      'Noch Fragen? Die [Spielregeln](/rules) erklären ein Battle Schritt für Schritt, und die [Anleitung für Streamer](/streamers) zeigt, wie du es in den Stream bringst.',
  },

  streamers: {
    title: 'Für Streamer | TuneBoxed',
    description:
      'Bring ein TuneBoxed-Song-Battle auf Twitch oder TikTok: Songs laufen als Boxer ein, der Chat tippt 1 oder 2 und teilt Schläge aus. Board als Tab oder Browser Source.',
    heading: 'Für Streamer',
    intro: 'Alles, was du brauchst, um ein Song-Battle in deinen Stream zu bringen – und worauf es Zugriff braucht und worauf nicht.',
    setupHeading: 'Einrichtung',
    steps: [
      {
        title: 'Mit Twitch anmelden',
        paragraphs: [
          'Darüber wissen wir, aus welchem Kanal wir die Stimmen lesen sollen, und dein Kanalname und Avatar erscheinen auf dem Board.',
        ],
      },
      {
        title: 'Raum starten',
        paragraphs: ['Du bekommst einen fünfstelligen Code aus Buchstaben und einen Beitrittslink. Lies den Code vor oder poste den Link im Chat.'],
      },
      {
        title: 'Board in den Stream bringen',
        paragraphs: [
          'Jeder Raum hat ein Board unter einer eigenen Adresse – gemacht als das, worauf dein Publikum schaut. Jedes Duell läuft als kompletter Boxkampf ab: die Einläufe, der Gong, der Kampf, Lebensbalken, Combos und Live-Stimmenzahlen. Öffne es in einem anderen Tab und steuere das Battle von dort – Songs aufdecken und Runden weiterschalten, ohne zurück in den Raum zu klicken.',
          'Kein OBS? Teile den Board-Tab als deinen Stream. Deine Buttons blenden sich aus, sobald du die Maus nicht bewegst, und bleiben so aus dem Bild. Das funktioniert auf jeder Plattform und braucht keine Installation.',
          'Du hast OBS, Streamlabs oder etwas anderes mit Browser Source (Browserquelle)? Füge dieselbe URL ein und stell sie auf 1920 mal 1080. Eine Browser Source hat keinen Login und kann deine Buttons daher nicht anzeigen. Es ist eine vollständige Szene statt eines transparenten Streifens, du brauchst also nichts dahinter.',
          'Auf dem Board laufen erst Songs, wenn du den Ton dorthin schickst. Stell in den „Game settings“ die Option „Sound comes from“ auf „Stream board“ und tippe dann einmal aufs Board, damit der Browser abspielt. Dort findest du auch den Lautstärkeregler und den Lautstärkeausgleich für Songs.',
        ],
      },
      {
        title: 'Sag dem Chat, er soll 1 oder 2 tippen',
        paragraphs: [
          'Das Board zeigt beide Songs nummeriert mit einer Live-Zählung. Der Chat stimmt ab, indem er nur die Zahl tippt, und jede Stimme ist ein Schlag. Die Abstimmung startet, wenn nach beiden Einläufen der Gong ertönt.',
        ],
      },
    ],
    sections: [
      {
        heading: 'So bringst du den Chat zum Kämpfen',
        paragraphs: [
          'Der Kampf belohnt einen Chat, der an einem Strang zieht. Drei Stimmen in Folge für einen Song sind eine Combo, sechs eine riesige Combo und neun eine Mega-Combo – das Board ruft jede mit der Serie aus. Eine Stimme für den anderen Song unterbricht sie, ein Chat mit Hin und Her bekommt also einen echten Schlagabtausch.',
          'Auch kleinere Kanäle bekommen keinen lahmen Kampf. Wenn nur eine Handvoll Stimmen reinkommt, schlägt jede auf dem Bildschirm härter zu: Bei fünf oder weniger in den letzten 15 Sekunden ist eine Stimme eine volle Combo. Das Board zeigt den Multiplikator an, solange er aktiv ist. Am Ergebnis ändert er nie etwas – das geht immer an den Song mit mehr echten Stimmen.',
          'Ein Song, der gar keine Stimmen bekommt, sobald fünf abgegeben wurden, geht k.o. Alles Knappere wird nach Punkten entschieden.',
        ],
      },
      {
        heading: 'Board checken, bevor du live gehst',
        paragraphs: [
          '[tuneboxed.com/tv/DEMO1?demo=1](/tv/DEMO1?demo=1) zeigt einen Beispielkampf mit erfundenen Songs und Chat, damit du das Board skalieren und platzieren kannst, ohne dass gerade ein Battle läuft. Jeder Raumcode funktioniert mit `?demo=1` am Ende.',
          'Der Ring ist 3D und läuft in jedem aktuellen Browser, auch in Browser Sources von OBS und Streamlabs unter Windows und Mac. Bleibt der Ring in OBS leer, prüf unter Einstellungen > Erweitert, ob die Hardwarebeschleunigung für Browser Sources eingeschaltet ist.',
        ],
      },
      {
        heading: 'Was es mit deinem Kanal machen kann – und was nicht',
        paragraphs: [
          'Der Chat wird anonym gelesen, genau so, wie ihn der Browser jedes Zuschauers liest. Das heißt: Kein Bot-Account tritt deinem Chat bei, du vergibst keine Mod- oder Chat-Rechte, und es gibt keinen Mechanismus, über den TuneBoxed in deinem Namen posten könnte. Lesen ist das Einzige, was es tut.',
          'Der Preis dafür, dass kein Server läuft: Gezählt wird in deinem Host-Tab. Stimmen sammeln sich nur, solange dieser Tab offen ist – lass ihn also während des ganzen Battles offen.',
        ],
      },
      {
        heading: 'Namen und Songtitel',
        paragraphs: [
          'Anzeigenamen sowie Titel von SoundCloud oder YouTube werden blockiert, wenn sie Beleidigungen enthalten. Normales Fluchen ist erlaubt. Katalogtracks von Apple Music werden nicht zusätzlich gefiltert, weil diese Titel bereits in einem Store stehen.',
          'Gewinner landen nur auf dem [öffentlichen Gewinner-Board](/winners), wenn du sie veröffentlichst – und du kannst den Siegersong auch ohne den Namen des Gewinners veröffentlichen.',
        ],
      },
      {
        heading: 'TikTok und andere Plattformen',
        paragraphs: [
          'Das Battle selbst funktioniert überall, wo du einen Link teilen und einen Tab per Bildschirmfreigabe zeigen kannst – TikTok, Kick, YouTube und Discord sind also kein Problem. Chat-Voting gibt es vorerst nur auf Twitch, weil es darauf basiert, den Twitch-Chat zu lesen. Überall sonst stimmen stattdessen die Spieler im Raum ab – so läuft es auch, wenn gar niemand streamt.',
        ],
      },
    ],
    footer: '[Starte ein Battle](/battle) oder lies die [Spielregeln](/rules).',
  },

  about: {
    title: 'Über uns | TuneBoxed',
    description:
      'TuneBoxed ist ein Musikspiel: Song-Battles als 3D-Boxkämpfe im Browser, bei denen jede Stimme ein Schlag ist – plus ein täglicher Musik-Feed auf iOS.',
    heading: 'Über TuneBoxed',
    intro: 'Ein Musikspiel über das eine Thema, über das jede Gruppe streitet: Wer hat den besseren Geschmack?',
    battlesHeading: 'Song-Battles, ausgetragen als Boxkämpfe',
    battles: [
      'Jemand startet einen Raum, alle anderen treten mit einem Code im Browser bei, und jeder Spieler wählt einen Song. Dann steigen zwei Songs in den Ring. Jeder ist ein Cartoon-Musiknoten-Boxer, der zu seinem eigenen Track einläuft, und sobald der Gong ertönt, ist jede Stimme ein Schlag. Drei in Folge sind eine Combo. Bekommt ein Song keine Stimme, geht er auf die Bretter. Das Bracket läuft, bis nur noch ein Song steht.',
      'Eine Umfrage sagt dir, wer vorne liegt. Ein Kampf lässt es den ganzen Raum spüren. Alle stylen ihren eigenen Boxer in der Umkleide, der Rest des Raums bildet die Crowd, und auch ein kleiner Chat bekommt einen echten Fight, weil jede Stimme auf dem Bildschirm härter zuschlägt, wenn weniger reinkommen.',
      'Es ist gemacht, um gemeinsam zugeschaut zu werden. Songs laufen synchron, sodass alle im selben Moment dasselbe hören, und jeder Raum hat ein Board, das du auf einen Fernseher, einen Beamer oder in einen Stream bringen kannst. Bist du auf Twitch, kann die Abstimmung direkt im Chat stattfinden, der sowieso schon da ist, statt auf einem zweiten Bildschirm.',
    ],
    iosHeading: 'Die iOS-App',
    ios: 'TuneBoxed hat auf dem iPhone angefangen und ist dort immer noch zu Hause. Jeden Tag gibt es ein neues Genre, du postest den Song, der am besten passt, und die Community stimmt ab. Battles gibt es auch, darunter Bar for Bar, dazu Ranglisten und Matching mit Leuten, die dasselbe posten wie du.',
    whoHeading: 'Wer dahintersteckt',
    who: 'TuneBoxed wird von Aura Brand LLC entwickelt.',
    footer: '[Starte ein Battle](/battle), lies die [Spielregeln](/rules) oder sieh dir das [Gewinner-Board](/winners) an.',
  },

  winners: {
    title: 'Gewinner | TuneBoxed',
    description: 'Songs, die ein TuneBoxed-Bracket gewonnen haben – veröffentlicht von den Hosts, die die Battles veranstaltet haben. Schau, welche Tracks ganz oben standen.',
    heading: 'Gewinner',
    intro: 'Songs, die sich durch ein ganzes Bracket gekämpft haben. Die Hosts entscheiden, ob ein Battle hier landet.',
    failed: 'Das Gewinner-Board konnte gerade nicht geladen werden. Versuch es gleich noch mal.',
    loading: 'Board wird geladen…',
    empty: 'Noch keine veröffentlichten Gewinner. Gewinn ein Bracket, dann kannst du den Song hier zeigen. [Starte ein Battle](/battle).',
    pickedBy: 'gewählt von {name}',
    room: 'Raum von {name}',
    players: '{count} Spieler',
    footer: 'Lies die [Spielregeln](/rules) oder [starte ein Battle](/battle).',
  },
};

export default de;
