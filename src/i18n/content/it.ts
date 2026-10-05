import type { Copy } from './en';

const it: Copy = {
  nav: {
    play: 'Gioca',
    rules: 'Regole del gioco',
    faq: 'FAQ',
    streamers: 'Per gli streamer',
    winners: 'Vincitori',
    about: 'Chi siamo',
    startBattle: 'Inizia una sfida',
    appStore: 'Scarica su App Store',
    iosApp: 'App iOS',
    language: 'Lingua',
    backToSite: 'Torna al sito',
  },

  home: {
    title: 'TuneBoxed | Sfide musicali combattute come incontri di boxe',
    headline: 'Abbiamo trasformato le sfide musicali in',
    headlineEm: 'incontri di boxe',
    lede: 'Due canzoni salgono sul ring. Decidi tu chi ne esce in piedi.',
    sub: 'Ognuno sceglie un brano. Due alla volta si affrontano faccia a faccia, e ogni voto è un pugno finché una canzone non finisce al tappeto. Attorno a un tavolo, in chiamata o in diretta su stream. Niente app, niente account.',
    ringTag: 'In diretta sullo stream board',
    howTitle: 'I voti sono pugni',
    howSub:
      'Gli altri siti di sfide musicali ti danno due barre e un totale. Un sondaggio ti dice chi sta vincendo. Un incontro di boxe lo fa sentire a tutta la stanza.',
    points: [
      {
        title: 'È la chat a tirare i pugni',
        body: 'Gli spettatori scrivono 1 o 2 nella tua chat di Twitch. Ogni voto fa vacillare l’altra canzone e le toglie energia, così il pubblico vede l’incontro cambiare in tempo reale.',
      },
      {
        title: 'Tre di fila fanno una combo',
        body: 'Vota la stessa canzone tre volte di fila e partirà una raffica di pugni. Sei di fila sono una combo enorme, nove una mega combo, e nelle chat piccole i colpi fanno più male, così ogni stream ha un vero incontro.',
      },
      {
        title: 'Lascia una canzone a zero e va giù',
        body: 'Un testa a testa si chiude ai punti. Una canzone che non riceve voti finisce al tappeto e il board dichiara il KO.',
      },
      {
        title: 'Niente da installare',
        body: 'Condividi un codice, condividi lo schermo. Nessun bot nel tuo canale, nessun OAuth sul tuo account, nessun download per i tuoi spettatori.',
      },
    ],
    steps: [
      'Crea una stanza e condividi il codice',
      'Ognuno sceglie una canzone e veste il suo pugile',
      'Le canzoni salgono sul ring, suona la campanella e i voti tirano i pugni',
    ],
    streamersLink: 'Come configurarlo per lo stream',
  },

  entry: {
    joinTitle: 'Entra nella sfida',
    hostTitle: 'Il Kahoot delle sfide musicali',
    joinSub: 'Scegli un nome che la stanza riconosca e buttati. Niente app, niente account.',
    hostSub: 'Crea una stanza per il tuo gruppo, oppure entra con un codice.',
    nameLabel: 'Il tuo nome',
    namePlaceholder: 'es. ninja',
    modeLabel: 'Modalità di gioco',
    partyDesc: 'Da 3 giocatori in su, un giudice a rotazione, al meglio delle 3. Come nell’app iOS.',
    bracketDesc: 'Fino a 16, uno contro uno. Parte in Classic: un solo vibe, canzoni scelte prima di iniziare.',
    codeLabel: 'Codice stanza',
    host: 'Ospita una sfida',
    creating: 'Creazione…',
    join: 'Entra nella sfida',
    joining: 'Ingresso…',
    toJoin: 'Hai un codice? Entra in una stanza',
    toHost: 'Ospita tu una sfida',
    signOut: 'Esci',
    twitch: 'Accedi con Twitch',
    twitchHint: 'Facoltativo. Permette alla tua chat di votare scrivendo su Twitch.',
    finding: 'Stiamo cercando il tuo posto…',
    playTitle: 'Gioca | TuneBoxed',
    joinPageTitle: 'Entra in una sfida | TuneBoxed',
  },

  stats: {
    heading: 'I numeri',
    battles: 'Sfide giocate',
    songs: 'Canzoni in gara',
    players: 'Giocatori',
    champions: 'Campioni',
  },

  rules: {
    title: 'Regole del gioco | TuneBoxed',
    description:
      'Come funziona TuneBoxed: le canzoni salgono sul ring come pugili, ogni voto è un pugno, tre di fila fanno una combo. Party al meglio di tre, Bracket fino a 16.',
    heading: 'Regole del gioco',
    intro: 'Due modi per giocare nel browser. Stesse canzoni, stesso codice stanza e stesso ring, con una strada diversa per arrivare al vincitore.',
    party: {
      heading: 'Party',
      sub: 'La stessa Battle Mode dell’app iOS. Pensata per un gruppo attorno a un tavolo o in chiamata.',
      steps: [
        {
          title: 'Crea una stanza Party',
          body: 'Ricevi un codice di cinque lettere. Condividilo in una chat di gruppo o leggilo ad alta voce. Tutti entrano dal browser. Niente app, niente account.',
        },
        {
          title: 'Ognuno sceglie una canzone',
          body: 'Tre o più giocatori. A ogni round tutti tranne il giudice bloccano un brano, con 90 secondi sul timer di default. L’host può dare più tempo o disattivare il timer. Se non fai in tempo, salti il round. Mentre aspetti, vesti il tuo pugile nello spogliatoio.',
        },
        {
          title: 'Le canzoni suonano insieme',
          body: 'Ogni scelta suona per 30 secondi di default, in sincrono per tutti nella stanza nello stesso momento. L’host può accorciare la durata. Quando restano esattamente due canzoni, il round passa sul ring: ogni canzone accompagna l’ingresso del suo pugile.',
        },
        {
          title: 'Un giudice a rotazione incorona il vincitore',
          body: 'Un giocatore non sceglie e decide quale canzone gli è piaciuta di più. Sul ring, il giudice incorona un angolo. Il ruolo di giudice cambia a ogni round.',
        },
        {
          title: 'Al meglio delle tre',
          body: 'Tre round, poi vince il giocatore con più corone.',
        },
      ],
    },
    bracket: {
      heading: 'Bracket',
      sub: 'Uno contro uno finché non resta una sola canzone. Il formato che uno stream può mettere a schermo. Classic è l’impostazione predefinita: un solo vibe, canzoni scelte prima. Passa alla modalità TuneBoxed nelle impostazioni di gioco se vuoi un vibe casuale nuovo per ogni sfida e un timer di scelta dal vivo.',
      steps: [
        {
          title: 'Crea una stanza Bracket',
          body: 'Fino a 16 giocatori. Condividi il codice come preferisci, anche in stream. Bracket parte in Classic.',
        },
        {
          title: 'Scegli un vibe, poi blocca le canzoni',
          body: 'L’host sceglie il vibe per tutta la partita: tramonto, rap del 2016, quello che vuole. I giocatori inviano le loro scelte prima che inizi qualsiasi cosa. Non c’è timer e niente è ancora in diretta, quindi nessuno ha fretta.',
        },
        {
          title: 'Due canzoni salgono sul ring',
          body: 'Ogni sfida è un incontro di boxe. Ogni pugile fa il suo ingresso sulla propria canzone, prima un angolo e poi l’altro, per 30 secondi di default e in sincrono per tutti nella stanza. L’host può cambiare la durata della clip. Sono le canzoni che i giocatori hanno bloccato, non una nuova scelta a ogni round.',
        },
        {
          title: 'È la stanza a tirare i pugni',
          body: 'Quando entrambe le canzoni sono state suonate, suona la campanella e si aprono le votazioni. Tutti nella stanza scelgono il brano che hanno preferito, tranne i due in gara. Se l’host è su Twitch, vota anche la chat scrivendo 1 o 2. Ogni voto è un pugno.',
        },
        {
          title: 'Chi vince passa il turno',
          body: 'La canzone con più voti avanza nel bracket, per KO o ai punti. In caso di pareggio, o se non arriva nessun voto, si tira a sorte. Si va avanti finché non resta in piedi un solo brano.',
        },
      ],
    },
    sections: [
      {
        heading: 'L’incontro',
        paragraphs: [
          'Ogni uno contro uno si combatte su un ring 3D tra due pugili a forma di nota musicale, uno nell’angolo blu e uno in quello arancione. Ognuno fa il suo ingresso sulla propria canzone, con un’entrata scelta a caso tra cinque, così nessun incontro inizia allo stesso modo. Tutti gli altri nella stanza sono tra il pubblico, e l’arbitro dirige l’incontro.',
        ],
        parts: [
          {
            title: 'I voti sono pugni',
            paragraphs: [
              'Quando entrambe le canzoni sono state suonate, suona la campanella e ogni voto è un pugno sull’altra canzone. Le barre dell’energia in alto seguono i voti: più una canzone va in vantaggio, più si svuota la barra dell’altra.',
            ],
          },
          {
            title: 'Combo',
            paragraphs: [
              'Tre voti di fila per la stessa canzone, senza nessuno per l’altra, sono una combo: una raffica di pugni invece di uno solo. Se la serie continua, la combo cresce. Sei di fila sono una combo enorme e nove una mega combo. Basta un voto per l’altro angolo per spezzare la serie.',
            ],
          },
          {
            title: 'Nelle stanze piccole i colpi fanno più male',
            paragraphs: [
              'Una chat tranquilla non deve sembrare un incontro moscio. Quando arrivano pochi voti, ognuno pesa di più sullo schermo: con cinque voti o meno negli ultimi 15 secondi, un voto vale una combo intera, e fino a dodici vale il doppio. Cambia solo la forza con cui arrivano i pugni. Il vincitore è sempre deciso dal conteggio reale dei voti.',
            ],
          },
          {
            title: 'KO o ai punti',
            paragraphs: [
              'Una canzone che non riceve voti, una volta arrivati almeno cinque voti, vede la sua barra svuotarsi e va giù: è un KO. Se è più combattuta si decide ai punti, e vince la canzone con più voti.',
            ],
          },
          {
            title: 'Il tuo pugile',
            paragraphs: [
              'Vesti il tuo pugile nello spogliatoio mentre la stanza blocca le canzoni: colore del corpo, stile della nota, bandiera, pantaloncini, guantoni, scarpe e corporatura. Resta tuo per il resto della partita. Se salti questo passaggio avrai comunque un pugile, con uno stile ispirato al tuo nome.',
            ],
          },
        ],
      },
      {
        heading: 'Cosa conta come voto nella chat di Twitch',
        paragraphs: [
          'Conta solo un messaggio che contiene esattamente il numero. Scrivere **1** è un voto per la prima canzone; scrivere “1 è meglio” no. Durante una sfida la chat è piena di numeri, e un controllo meno rigido falserebbe il risultato senza che nessuno se ne accorga.',
          'I voti vengono contati finché la scheda da cui ospiti è aperta. Se la chiudi durante una votazione, i voti della chat smettono di essere contati finché non la riapri.',
        ],
      },
      {
        heading: 'Numero dispari di giocatori',
        paragraphs: [
          'Un bracket ha bisogno di coppie. Quando i giocatori sono dispari, i turni di riposo vengono distribuiti nella prima fase invece di accumularsi alla fine, così al massimo un giocatore per sfida resta fuori. Con un turno di riposo passi alla fase successiva senza giocare. Nella modalità TuneBoxed lì scegli di nuovo; in Classic tieni la canzone che avevi bloccato.',
          'Se ti ritrovi in una sfida senza nessuno dall’altra parte, passi il turno senza giocare invece di aspettare un avversario che non arriverà mai.',
        ],
      },
      {
        heading: 'Se il tempo scade',
        paragraphs: [
          'Quando il timer di scelta arriva a zero, il round si chiude con quello che c’è. Se solo una persona ha inviato una canzone, vince il round: presentarsi batte non presentarsi. Se nessuno l’ha fatto, l’host può aggiungere altro tempo.',
        ],
      },
      {
        heading: 'Da dove arrivano le canzoni',
        paragraphs: [
          'La ricerca copre il catalogo musicale pubblico di Apple, e ogni risultato suona come clip di 30 secondi. Nessuno ha bisogno di un abbonamento a Spotify o Apple Music, perché tutti nella stanza ascoltano la stessa anteprima invece di uno stream a cui solo alcuni possono accedere.',
          'Passa la ricerca ai video musicali per sfidarti con il video invece che con il brano. Usa lo stesso timer e la stessa durata della clip, così la stanza lo guarda insieme invece di limitarsi ad ascoltarlo.',
          'Invece di cercare puoi anche incollare un link di SoundCloud o YouTube: è il modo per sfidarti con una canzone che il catalogo Apple non ha. Quei brani suonano nei player di SoundCloud e YouTube, quindi restano a schermo durante la sfida. Partono anche con un po’ meno precisione rispetto a un’anteprima, perché il player deve prima caricarsi e YouTube potrebbe mostrare una pubblicità: aspettati un secondo o due di ritardo invece della sincronia esatta che hai con la ricerca.',
        ],
      },
    ],
    footer: '[Inizia una sfida](/battle) oppure leggi le [FAQ](/faq).',
  },

  faq: {
    title: 'FAQ | TuneBoxed',
    description:
      'Risposte su TuneBoxed: come funzionano l’incontro di boxe e le combo, come entrare dal browser, il voto in chat, la sfida in stream e quanto dura un bracket.',
    heading: 'FAQ',
    intro: 'Le domande che saltano fuori quando organizzi una sfida.',
    items: [
      {
        q: 'Come funziona l’incontro di boxe?',
        a: 'Ogni uno contro uno è un incontro tra due pugili a forma di nota musicale su un ring 3D. Ognuno fa il suo ingresso sulla propria canzone, prima un angolo e poi l’altro, con un’entrata scelta a caso tra cinque. Quando entrambe le canzoni sono state suonate suona la campanella, e ogni voto è un pugno sull’altra canzone che ne svuota la barra dell’energia. Vince la canzone con più voti: per KO se l’altra non ne ha ricevuto nessuno, ai punti se è stata più combattuta.',
      },
      {
        q: 'Cos’è una combo?',
        a: 'Tre voti di fila per la stessa canzone, senza nessuno per l’altra nel mezzo, sono una combo: una raffica di pugni invece di uno solo. Sei di fila sono una combo enorme e nove una mega combo. Basta un voto per l’altro angolo per spezzare la serie.',
      },
      {
        q: 'La mia chat è piccola. Gli incontri saranno comunque belli da vedere?',
        a: 'Sì. Quando arrivano pochi voti, ognuno colpisce più forte sullo schermo. Con cinque voti o meno negli ultimi 15 secondi, un solo voto vale una combo intera, e fino a dodici ogni voto vale il doppio. Cambiano solo i pugni. Vince sempre la canzone con più voti reali.',
      },
      {
        q: 'Posso personalizzare il mio pugile?',
        a: 'Sì. Mentre la stanza blocca le canzoni, nello spogliatoio puoi scegliere colore del corpo, stile della nota, bandiera, pantaloncini, guantoni, scarpe e corporatura, e tirare qualche jab per vedere come sta. Il tuo pugile mantiene quel look per il resto della partita. Se salti questo passaggio, ne avrai uno con uno stile ispirato al tuo nome.',
      },
      {
        q: 'Con quali browser funziona?',
        a: 'Con qualsiasi browser aggiornato su computer o telefono: Chrome, Edge, Firefox, Safari e browser Chromium come Brave e Opera, su Windows, Mac, Linux, iOS e Android. Il ring richiede WebGL, che hanno tutti a meno che non sia stato disattivato. In OBS, lascia attiva l’accelerazione hardware della browser source, che è l’impostazione predefinita.',
      },
      {
        q: 'I miei spettatori devono scaricare qualcosa?',
        a: 'No. Aprono il link nel browser che hanno già, scrivono un nome e sono dentro. Non c’è nessuna app da installare e nessun account da creare.',
      },
      {
        q: 'Mi serve un account Twitch?',
        a: 'Solo se vuoi che voti la chat. Puoi organizzare una sfida senza accedere, e in quel caso votano i giocatori nella stanza. Accedere con Twitch ci permette di sapere da quale canale leggere i voti.',
      },
      {
        q: 'Come funziona il voto nella chat di Twitch?',
        a: 'Durante la votazione i tuoi spettatori scrivono 1 o 2 per la canzone che preferiscono. Ogni account Twitch ha un voto per sfida, e votando di nuovo il voto si sposta invece di aggiungersene un secondo.',
      },
      {
        q: 'Serve un bot nella mia chat?',
        a: 'No. La chat viene letta in modo anonimo, quindi non c’è nessun account bot da aggiungere, nessun permesso da moderatore da concedere e nessun modo per TuneBoxed di scrivere messaggi al posto tuo. Si limita a leggere.',
      },
      {
        q: 'Devo tenere la scheda aperta?',
        a: 'Sì. I voti della chat vengono contati nella scheda da cui ospiti, quindi si accumulano solo finché è aperta. Se la chiudi durante una votazione, il conteggio si ferma finché non la riapri.',
      },
      {
        q: 'Quante persone possono giocare?',
        a: 'Un bracket ospita fino a 16 giocatori che scelgono le canzoni. Non c’è limite al numero di persone che possono votare in chat.',
      },
      {
        q: 'Posso mettere la sfida nel mio stream?',
        a: 'Sì. Ogni stanza ha un board a un indirizzo dedicato che mostra tutto: gli ingressi, l’incontro, le barre dell’energia, le combo e il conteggio dei voti in diretta. Aprilo in un’altra scheda e condividila come stream: da quella schermata puoi rivelare le canzoni e far avanzare i round, e i pulsanti spariscono quando smetti di muovere il mouse. Oppure incolla lo stesso URL in OBS, Streamlabs o qualsiasi altro programma con una Browser Source. Non serve nessun software di trasmissione.',
      },
      {
        q: 'Quanto dura una sfida?',
        a: 'Nella modalità TuneBoxed i giocatori hanno 90 secondi per scegliere di default, e ogni canzone suona per 30 secondi. L’host può cambiare entrambi nelle impostazioni di gioco. Classic non ha un timer di scelta: le canzoni vengono inviate prima che l’host avvii la partita. Un bracket completo da 16 giocatori ha quattro fasi, quindi calcola tra i 15 e i 25 minuti circa, a seconda di quanto tieni aperte le votazioni.',
      },
      {
        q: 'Che differenza c’è tra Classic e la modalità TuneBoxed?',
        a: 'Classic è l’impostazione predefinita per un bracket. L’host sceglie un solo vibe per tutta la partita, i giocatori bloccano una canzone nella lobby senza timer, e quelle sono le canzoni che si sfidano nel bracket. La modalità TuneBoxed è il gioco dal vivo: un vibe casuale nuovo a ogni round e un timer di scelta impostato dall’host (90 secondi di default). Puoi cambiare nelle impostazioni di gioco.',
      },
      {
        q: 'Da dove arrivano le canzoni?',
        a: 'I giocatori cercano nel catalogo musicale pubblico di Apple, e ogni brano suona come anteprima di 30 secondi. Nessuno ha bisogno di un abbonamento a Spotify o Apple Music.',
      },
      {
        q: 'Posso usare SoundCloud o YouTube?',
        a: 'Sì. Invece di cercare, incolla un link di SoundCloud o YouTube: è il modo per sfidarti con qualcosa che il catalogo Apple non ha. Quei brani suonano nei player di SoundCloud e YouTube invece che come anteprima, quindi il player resta visibile durante la sfida e la partenza è meno precisa di un secondo o due, soprattutto se YouTube manda prima una pubblicità.',
      },
      {
        q: 'È gratis?',
        a: 'Sì. Ospitare una sfida ed entrarci sul web è gratis.',
      },
      {
        q: 'Cosa succede se qualcuno si disconnette?',
        a: 'Il suo posto resta riservato e può rientrare con lo stesso link. Se non torna, la sfida continua senza di lui.',
      },
      {
        q: 'È la stessa cosa dell’app iOS?',
        a: 'Usa gli stessi server. Party sul web è la stessa Battle Mode dell’app iOS: al meglio delle tre, con giudice a rotazione. Bracket è il formato per gli streamer. L’app iOS ha anche un feed musicale quotidiano che il sito non ha.',
      },
    ],
    footer:
      'Sei ancora bloccato? Le [regole del gioco](/rules) spiegano una sfida passo dopo passo, e la [guida per gli streamer](/streamers) ti mostra come portarla in stream.',
  },

  streamers: {
    title: 'Per gli streamer | TuneBoxed',
    description:
      'Porta una sfida TuneBoxed su Twitch o TikTok: le canzoni salgono sul ring come pugili e la chat scrive 1 o 2 per tirare pugni. Condividi il board come scheda.',
    heading: 'Per gli streamer',
    intro: 'Tutto quello che ti serve per portare una sfida musicale in stream, e a cosa ha bisogno di accedere (e a cosa no).',
    setupHeading: 'Configurazione',
    steps: [
      {
        title: 'Accedi con Twitch',
        paragraphs: [
          'Così sappiamo da quale canale leggere i voti, e il nome e l’avatar del tuo canale compaiono sul board.',
        ],
      },
      {
        title: 'Crea una stanza',
        paragraphs: ['Ricevi un codice di cinque lettere e un link d’invito. Leggi il codice ad alta voce o incolla il link in chat.'],
      },
      {
        title: 'Metti il board in stream',
        paragraphs: [
          'Ogni stanza ha un board a un indirizzo dedicato, pensato per essere ciò che guarda il tuo pubblico. Ogni sfida si gioca come un vero incontro di boxe: gli ingressi, la campanella, l’incontro, le barre dell’energia, le combo e il conteggio dei voti in diretta. Aprilo in un’altra scheda e gestisci la sfida da lì: rivela le canzoni e fai avanzare i round senza tornare alla stanza.',
          'Niente OBS? Condividi la scheda del board come stream. I tuoi pulsanti spariscono quando smetti di muovere il mouse, così restano fuori dall’inquadratura. Funziona su qualsiasi piattaforma e non richiede installazioni.',
          'Hai OBS, Streamlabs o qualsiasi programma con una Browser Source (sorgente browser)? Incolla lo stesso URL e impostalo a 1920 per 1080. Una Browser Source non ha accesso al tuo login, quindi non può mostrare i tuoi pulsanti. È una scena completa e non una striscia trasparente, quindi non ha bisogno di niente dietro.',
          'Le canzoni non suonano sul board finché non ci mandi l’audio. In “Game settings”, imposta “Sound comes from” su “Stream board”, poi tocca il board una volta così il browser può riprodurre l’audio. Lì trovi anche il cursore del volume e la normalizzazione delle canzoni.',
        ],
      },
      {
        title: 'Di’ alla chat di scrivere 1 o 2',
        paragraphs: [
          'Il board mostra le due canzoni numerate, con un conteggio in diretta. La chat vota scrivendo solo il numero, e ogni voto è un pugno. Le votazioni si aprono quando suona la campanella dopo i due ingressi.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Far combattere la chat',
        paragraphs: [
          'L’incontro premia una chat che fa squadra. Tre voti di fila per una canzone sono una combo, sei una combo enorme e nove una mega combo, e il board le annuncia tutte insieme alla serie. Un voto per l’altra canzone la spezza, quindi una chat che va avanti e indietro regala una vera battaglia a suon di pugni.',
          'I canali più piccoli non si ritrovano con un incontro lento. Quando arrivano solo pochi voti, ognuno colpisce più forte sullo schermo: con cinque voti o meno negli ultimi 15 secondi, un voto vale una combo intera. Il board mostra il moltiplicatore mentre è attivo. Non cambia mai il risultato, che va sempre alla canzone con più voti reali.',
          'Una canzone che non riceve nessun voto, una volta arrivati cinque voti, va KO. Se è più combattuta, si decide ai punti.',
        ],
      },
      {
        heading: 'Controllare il board prima di andare in diretta',
        paragraphs: [
          '[tuneboxed.com/tv/DEMO1?demo=1](/tv/DEMO1?demo=1) avvia un incontro di prova con canzoni e chat inventate, così puoi dimensionarlo e posizionarlo senza bisogno di una sfida in corso. Funziona con qualsiasi codice stanza aggiungendo `?demo=1` alla fine.',
          'Il ring è in 3D e funziona in qualsiasi browser aggiornato, comprese le browser source di OBS e Streamlabs su Windows e Mac. Se in OBS il ring resta vuoto, controlla che l’accelerazione hardware della browser source sia attiva in Impostazioni, Avanzate.',
        ],
      },
      {
        heading: 'Cosa può e non può fare al tuo canale',
        paragraphs: [
          'La chat viene letta in modo anonimo, come la legge il browser di qualsiasi spettatore. Questo significa che nessun account bot entra nella tua chat, non concedi permessi da moderatore o di chat, e non esiste alcun meccanismo con cui TuneBoxed possa scrivere un messaggio al posto tuo. Leggere è l’unica cosa che fa.',
          'Il compromesso per non usare un server è che il conteggio avviene nella scheda da cui ospiti. I voti si accumulano solo finché quella scheda è aperta, quindi tienila aperta per tutta la durata della sfida.',
        ],
      },
      {
        heading: 'Nomi e titoli delle canzoni',
        paragraphs: [
          'I nomi visualizzati, e i titoli da SoundCloud o YouTube, vengono bloccati se contengono insulti offensivi. Le parolacce comuni sono permesse. I brani del catalogo di Apple Music non vengono filtrati di nuovo, perché quei titoli sono già in uno store.',
          'I vincitori vengono pubblicati sulla [bacheca pubblica dei vincitori](/winners) solo se scegli di pubblicarli, e puoi pubblicare la canzone vincitrice senza il nome di chi l’ha scelta.',
        ],
      },
      {
        heading: 'TikTok e altre piattaforme',
        paragraphs: [
          'La sfida in sé funziona ovunque tu possa condividere un link e lo schermo di una scheda, quindi TikTok, Kick, YouTube e Discord vanno benissimo. Per ora il voto in chat è solo su Twitch, perché si basa sulla lettura della chat di Twitch. Altrove votano i giocatori nella stanza, che è anche come funziona quando nessuno è in streaming.',
        ],
      },
    ],
    footer: '[Inizia una sfida](/battle) oppure leggi le [regole del gioco](/rules).',
  },

  about: {
    title: 'Chi siamo | TuneBoxed',
    description:
      'TuneBoxed è un gioco musicale: sfide tra canzoni combattute come incontri di boxe 3D nel browser, dove ogni voto è un pugno, e un feed musicale ogni giorno su iOS.',
    heading: 'Chi siamo',
    intro: 'Un gioco musicale sull’unica cosa su cui ogni gruppo litiga: chi ha i gusti migliori.',
    battlesHeading: 'Sfide musicali, combattute come incontri di boxe',
    battles: [
      'Qualcuno crea una stanza, tutti gli altri entrano dal browser con un codice, e ogni giocatore sceglie una canzone. Poi due canzoni salgono sul ring. Ognuna è un pugile cartoon a forma di nota musicale che fa il suo ingresso sul proprio brano, e quando suona la campanella ogni voto è un pugno. Tre di fila fanno una combo. Lascia una canzone a zero e finisce al tappeto. Il bracket va avanti finché non resta in piedi una sola canzone.',
      'Un sondaggio ti dice chi sta vincendo. Un incontro di boxe lo fa sentire a tutta la stanza. Ognuno veste il proprio pugile nello spogliatoio, il resto della stanza riempie il pubblico, e anche una chat piccola ha un vero incontro, perché ogni voto colpisce più forte sullo schermo quando ne arrivano pochi.',
      'È fatto per essere guardato insieme. Le canzoni suonano in sincrono così tutti sentono la stessa cosa nello stesso momento, e ogni stanza ha un board che puoi mettere su una TV, un proiettore o uno stream. Se sei su Twitch, si può votare nella chat che c’è già invece che su un secondo schermo.',
    ],
    iosHeading: 'L’app iOS',
    ios: 'TuneBoxed è nato su iPhone e vive ancora lì. Ogni giorno c’è un nuovo genere, tu pubblichi la canzone che ci sta meglio e la community vota. Ci sono anche le sfide, tra cui Bar for Bar, oltre alle classifiche e al matching con persone che pubblicano le tue stesse cose.',
    whoHeading: 'Chi lo crea',
    who: 'TuneBoxed è creato da Aura Brand LLC.',
    footer: '[Inizia una sfida](/battle), leggi le [regole del gioco](/rules) o guarda la [bacheca dei vincitori](/winners).',
  },

  winners: {
    title: 'Vincitori | TuneBoxed',
    description: 'Le canzoni che hanno vinto un bracket di TuneBoxed, pubblicate dagli host che hanno organizzato le sfide. Scopri quali brani sono rimasti in piedi.',
    heading: 'Vincitori',
    intro: 'Le canzoni che hanno superato un intero bracket. Sono gli host a scegliere se una sfida finisce qui.',
    failed: 'Al momento non è possibile caricare la bacheca dei vincitori. Riprova tra poco.',
    loading: 'Caricamento della bacheca…',
    empty: 'Ancora nessun vincitore pubblicato. Vinci un bracket e potrai mettere qui la tua canzone. [Inizia una sfida](/battle).',
    pickedBy: 'scelta da {name}',
    room: 'La stanza di {name}',
    players: '{count} giocatori',
    footer: 'Leggi le [regole del gioco](/rules) oppure [inizia una sfida](/battle).',
  },
};

export default it;
