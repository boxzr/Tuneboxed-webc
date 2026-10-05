import type { Copy } from './en';

const es: Copy = {
  nav: {
    play: 'Jugar',
    rules: 'Reglas del juego',
    faq: 'FAQ',
    streamers: 'Para streamers',
    winners: 'Ganadores',
    about: 'Acerca de',
    startBattle: 'Iniciar una batalla',
    appStore: 'Descargar en el App Store',
    iosApp: 'App de iOS',
    language: 'Idioma',
    backToSite: 'Volver al sitio',
  },

  home: {
    title: 'TuneBoxed | Batallas de canciones convertidas en peleas de box',
    headline: 'Convertimos las batallas de canciones en',
    headlineEm: 'peleas de box',
    lede: 'Dos canciones suben al ring. Tú decides cuál sale ganando.',
    sub: 'Cada quien elige un tema. Dos de ellos se enfrentan cara a cara, y cada voto conecta un golpe hasta que una canción termina en la lona. En una mesa, en una llamada o en vivo en tu stream. Sin app, sin cuenta.',
    ringTag: 'En vivo en la pantalla del stream',
    howTitle: 'Los votos son golpes',
    howSub:
      'Otros sitios de batallas de canciones te dan dos barras y un total. Una encuesta te dice quién va ganando. Una pelea hace que todos lo sientan.',
    points: [
      {
        title: 'El chat tira los golpes',
        body: 'Tus viewers escriben 1 o 2 en tu chat de Twitch. Cada voto sacude a la otra canción y le baja la vida, así que el público ve cómo la pelea cambia en tiempo real.',
      },
      {
        title: 'Tres seguidos es un combo',
        body: 'Apoya a una canción tres veces seguidas y suelta una ráfaga de golpes. Seis es un combo enorme, nueve un mega combo, y los chats pequeños pegan más fuerte para que cada stream tenga una pelea de verdad.',
      },
      {
        title: 'Sin votos, a la lona',
        body: 'Un duelo cerrado se va a decisión. Una canción por la que nadie vota cae a la lona, y la pantalla canta el nocaut.',
      },
      {
        title: 'Nada que instalar',
        body: 'Comparte un código, comparte tu pantalla. Sin bot en tu canal, sin OAuth en tu cuenta, sin descargas para tus viewers.',
      },
    ],
    steps: [
      'Crea una sala y comparte el código',
      'Cada quien elige una canción y viste a su boxeador',
      'Las canciones salen al ring, suena la campana y los votos tiran los golpes',
    ],
    streamersLink: 'Cómo ponerlo en tu stream',
  },

  entry: {
    joinTitle: 'Únete a la batalla',
    hostTitle: 'El Kahoot de las batallas de canciones',
    joinSub: 'Elige un nombre que la sala reconozca y entra. Sin app, sin cuenta.',
    hostSub: 'Crea una sala para tu grupo, o entra a una con un código.',
    nameLabel: 'Tu nombre',
    namePlaceholder: 'ej. ninja',
    modeLabel: 'Modo de juego',
    partyDesc: '3 jugadores o más, un juez que rota, al mejor de 3. Igual que en la app de iOS.',
    bracketDesc: 'Hasta 16, cara a cara. Abre en Classic: un solo vibe, canciones elegidas antes de empezar.',
    codeLabel: 'Código de la sala',
    host: 'Organizar una batalla',
    creating: 'Creando…',
    join: 'Unirse a la batalla',
    joining: 'Entrando…',
    toJoin: '¿Tienes un código? Únete a una sala',
    toHost: 'Mejor organiza una batalla',
    signOut: 'Cerrar sesión',
    twitch: 'Iniciar sesión con Twitch',
    twitchHint: 'Opcional. Permite que tu chat vote escribiendo en Twitch.',
    finding: 'Buscando tu lugar…',
    playTitle: 'Jugar | TuneBoxed',
    joinPageTitle: 'Únete a una batalla | TuneBoxed',
  },

  stats: {
    heading: 'En números',
    battles: 'Batallas jugadas',
    songs: 'Canciones en batalla',
    players: 'Jugadores',
    champions: 'Campeones',
  },

  rules: {
    title: 'Reglas del juego | TuneBoxed',
    description:
      'Cómo funciona TuneBoxed: las canciones salen como boxeadores, cada voto es un golpe y tres seguidos son un combo. Party es al mejor de tres; Bracket admite hasta 16 jugadores.',
    heading: 'Reglas del juego',
    intro: 'Dos formas de jugar en el navegador. Las mismas canciones, el mismo código de sala y el mismo ring, con un camino distinto hacia el ganador.',
    party: {
      heading: 'Party',
      sub: 'El mismo Battle Mode de la app de iOS. Pensado para un grupo alrededor de una mesa o en una llamada.',
      steps: [
        {
          title: 'Crea una sala Party',
          body: 'Recibes un código de cinco letras. Compártelo en un grupo o dilo en voz alta. Todos entran desde su navegador. Sin app, sin cuenta.',
        },
        {
          title: 'Cada quien elige una canción',
          body: 'Tres jugadores o más. En cada ronda, todos menos el juez eligen un tema, con 90 segundos en el reloj por defecto. El anfitrión puede dar más tiempo o apagar el reloj. Si no llegas, quedas fuera de la ronda. Mientras esperas, viste a tu boxeador en el vestidor.',
        },
        {
          title: 'Las canciones suenan juntas',
          body: 'Cada elección suena 30 segundos por defecto, sincronizada para todos en la sala al mismo tiempo. El anfitrión puede acortarla. Cuando hay exactamente dos canciones, la ronda pasa al ring: cada canción es la entrada de su boxeador.',
        },
        {
          title: 'Un juez que rota corona al ganador',
          body: 'Un jugador no elige canción y escoge la que más le gustó. En el ring, el juez corona una esquina. El rol de juez cambia en cada ronda.',
        },
        {
          title: 'Al mejor de tres',
          body: 'Tres rondas, y gana el jugador con más coronas.',
        },
      ],
    },
    bracket: {
      heading: 'Bracket',
      sub: 'Cara a cara hasta que quede una sola canción. El formato que un stream puede poner en pantalla. Classic es el modo por defecto: un solo vibe, canciones elegidas primero. Cambia a modo TuneBoxed en los ajustes del juego si quieres un vibe aleatorio nuevo en cada duelo y un reloj de elección en vivo.',
      steps: [
        {
          title: 'Crea una sala Bracket',
          body: 'Hasta 16 jugadores. Comparte el código como quieras, incluso en un stream. Bracket abre en Classic.',
        },
        {
          title: 'Elige un vibe y luego fija las canciones',
          body: 'El anfitrión define el vibe de todo el juego: atardecer, rap de 2016, lo que quiera. Los jugadores mandan su canción antes de que empiece nada. No hay reloj y nada está en vivo todavía, así que nadie va con prisa.',
        },
        {
          title: 'Dos canciones salen al ring',
          body: 'Cada duelo es una pelea de box. Cada boxeador sale con su canción, una esquina y luego la otra, durante 30 segundos por defecto y sincronizado para todos en la sala. El anfitrión puede cambiar la duración del clip. Son las canciones que la gente fijó al inicio, no una nueva elección en cada ronda.',
        },
        {
          title: 'La sala tira los golpes',
          body: 'Cuando las dos canciones terminan, suena la campana y se abre la votación. Todos en la sala eligen el tema que más les gustó, menos los dos del duelo. Si el anfitrión está en Twitch, el chat también vota escribiendo 1 o 2. Cada voto es un golpe.',
        },
        {
          title: 'El ganador avanza',
          body: 'La canción con más votos sube en el bracket, por nocaut o por decisión de los jueces. Un empate, o ningún voto, se define con un volado. Se repite hasta que quede un solo tema en pie.',
        },
      ],
    },
    sections: [
      {
        heading: 'La pelea',
        paragraphs: [
          'Cada duelo se pelea en un ring 3D entre dos boxeadores con forma de nota musical, uno en la esquina azul y otro en la naranja. Cada uno sale con su propia canción y una entrada elegida al azar entre cinco, así que ninguna pelea empieza igual. El resto de la sala es el público, y el réferi decide.',
        ],
        parts: [
          {
            title: 'Los votos son golpes',
            paragraphs: [
              'Cuando terminan las dos canciones, suena la campana y cada voto conecta un golpe a la otra canción. Las barras de vida de arriba siguen la votación: entre más se adelanta una canción, más se vacía la barra de la otra.',
            ],
          },
          {
            title: 'Combos',
            paragraphs: [
              'Tres votos seguidos para la misma canción, sin ninguno para la otra, es un combo: una ráfaga de golpes en vez de uno solo. Si sigue la racha, crece. Seis seguidos es un combo enorme y nueve es un mega combo. Un solo voto para la otra esquina rompe la racha.',
            ],
          },
          {
            title: 'Las salas pequeñas pegan más fuerte',
            paragraphs: [
              'Un chat tranquilo no tiene por qué dar una pelea aburrida. Cuando llegan pocos votos, cada uno cuenta más en pantalla: con cinco o menos en los últimos 15 segundos, un voto es un combo completo, y hasta doce, vale el doble. Esto solo cambia qué tan fuerte pegan los golpes. El ganador siempre se decide por el conteo real de votos.',
            ],
          },
          {
            title: 'Nocaut o decisión',
            paragraphs: [
              'Una canción por la que nadie vota, cuando ya hay al menos cinco votos, se queda sin barra y cae: eso es un nocaut. Si está más cerrado, se va a decisión, y gana la canción con más votos.',
            ],
          },
          {
            title: 'Tu boxeador',
            paragraphs: [
              'Viste a tu boxeador en el vestidor mientras la sala fija las canciones: color del cuerpo, estilo de nota, bandera, short, guantes, tenis y complexión. Se queda contigo el resto del juego. Si te lo saltas, igual tienes un boxeador, con un estilo basado en tu nombre.',
            ],
          },
        ],
      },
      {
        heading: 'Qué cuenta como voto en el chat de Twitch',
        paragraphs: [
          'Solo cuenta un mensaje que sea exactamente el número. Escribir **1** vota por la primera canción; escribir “la 1 es mejor” no cuenta. Durante una batalla el chat está lleno de números, y una detección aproximada alteraría el resultado sin que nadie lo note.',
          'Los votos se cuentan mientras tu pestaña de anfitrión esté abierta. Si la cierras a mitad de la votación, los votos del chat dejan de contarse hasta que la vuelvas a abrir.',
        ],
      },
      {
        heading: 'Número impar de jugadores',
        paragraphs: [
          'Un bracket necesita parejas. Cuando el número es impar, los pases directos se reparten en la primera fase en vez de acumularse al final, así que como mucho un jugador por duelo se queda fuera. Un pase directo te manda a la siguiente fase sin jugar. En modo TuneBoxed vuelves a elegir ahí; en Classic te quedas con la canción que fijaste.',
          'Si alguna vez llegas a un duelo sin nadie enfrente, lo ganas sin jugar la ronda en vez de esperar a un rival que nunca va a llegar.',
        ],
      },
      {
        heading: 'Si se acaba el reloj',
        paragraphs: [
          'Cuando el reloj de elección llega a cero, la ronda se cierra con lo que haya. Si solo una persona metió canción, gana la ronda: presentarse le gana a no presentarse. Si nadie lo hizo, el anfitrión puede darle más tiempo al reloj.',
        ],
      },
      {
        heading: 'De dónde salen las canciones',
        paragraphs: [
          'La búsqueda cubre el catálogo musical público de Apple, y cada resultado suena como un clip de 30 segundos. Nadie necesita suscripción a Spotify o Apple Music, porque todos en la sala escuchan el mismo preview y no un stream al que solo algunos tienen acceso.',
          'Cambia la búsqueda a videos musicales para pelear con el video en vez del tema. Usa el mismo reloj y la misma duración de clip, así que la sala lo ve junta en lugar de solo escucharlo.',
          'También puedes pegar un link de SoundCloud o YouTube en vez de buscar, y así puedes meter a pelear una canción que no está en el catálogo de Apple. Esas suenan en los reproductores propios de SoundCloud y YouTube, así que se quedan en pantalla durante el duelo. Además arrancan con algo menos de precisión que un preview, porque el reproductor tiene que cargar primero y YouTube puede poner un anuncio, así que cuenta con uno o dos segundos de desfase en vez de la sincronía exacta de la búsqueda.',
        ],
      },
    ],
    footer: '[Inicia una batalla](/battle) o lee las [preguntas frecuentes](/faq).',
  },

  faq: {
    title: 'Preguntas frecuentes | TuneBoxed',
    description:
      'Respuestas sobre TuneBoxed: cómo funcionan la pelea de box y los combos, entrar desde el navegador, la votación del chat, la pelea en stream y cuánto dura un bracket.',
    heading: 'Preguntas frecuentes',
    intro: 'Dudas que salen al organizar una batalla.',
    items: [
      {
        q: '¿Cómo funciona la pelea de box?',
        a: 'Cada duelo es una pelea entre dos boxeadores con forma de nota musical en un ring 3D. Cada uno sale con su canción, una esquina y luego la otra, con una entrada elegida al azar entre cinco. Cuando terminan las dos canciones suena la campana, y cada voto conecta un golpe a la otra canción y le baja la barra de vida. Gana la canción con más votos: por nocaut si la otra no recibió ninguno, por decisión si estuvo más cerrado.',
      },
      {
        q: '¿Qué es un combo?',
        a: 'Tres votos seguidos para la misma canción, sin ninguno para la otra en medio, es un combo: una ráfaga de golpes en vez de uno solo. Seis seguidos es un combo enorme y nueve es un mega combo. Un voto para la otra esquina rompe la racha.',
      },
      {
        q: 'Mi chat es pequeño. ¿Las peleas se van a ver bien?',
        a: 'Sí. Cuando llegan pocos votos, cada uno pega más fuerte en pantalla. Con cinco votos o menos en los últimos 15 segundos, un solo voto es un combo completo, y hasta doce, cada voto vale el doble. Solo cambia los golpes. El ganador siempre es la canción con más votos reales.',
      },
      {
        q: '¿Puedo personalizar a mi boxeador?',
        a: 'Sí. Mientras la sala fija las canciones, el vestidor te deja elegir color del cuerpo, estilo de nota, bandera, short, guantes, tenis y complexión, y tirar unos jabs para ver cómo se ve. Tu boxeador mantiene ese look el resto del juego. Si te lo saltas, te toca uno con estilo basado en tu nombre.',
      },
      {
        q: '¿En qué navegadores funciona?',
        a: 'En cualquier navegador actual en computadora o celular: Chrome, Edge, Firefox, Safari y navegadores Chromium como Brave y Opera, en Windows, Mac, Linux, iOS y Android. El ring necesita WebGL, que todos tienen a menos que esté desactivado. En OBS, deja activada la aceleración por hardware de la fuente de navegador, que viene así por defecto.',
      },
      {
        q: '¿Mis viewers tienen que descargar algo?',
        a: 'No. Abren el link en el navegador que ya tengan, escriben un nombre y listo. No hay app que instalar ni cuenta que crear.',
      },
      {
        q: '¿Necesito una cuenta de Twitch?',
        a: 'Solo si quieres que el chat vote. Puedes hacer una batalla sin iniciar sesión, y en ese caso votan los jugadores de la sala. Iniciar sesión con Twitch es lo que nos dice de qué canal leer los votos.',
      },
      {
        q: '¿Cómo funciona la votación en el chat de Twitch?',
        a: 'Durante la votación, tus viewers escriben 1 o 2 por la canción que prefieren. Cada cuenta de Twitch tiene un voto por duelo, y si vuelve a votar, el voto se cambia en vez de sumar uno nuevo.',
      },
      {
        q: '¿Necesito un bot en mi chat?',
        a: 'No. El chat se lee de forma anónima, así que no hay cuenta de bot que agregar, ni permisos de moderador que dar, ni forma de que TuneBoxed publique mensajes como si fueras tú. Solo lee.',
      },
      {
        q: '¿Tengo que dejar la pestaña abierta?',
        a: 'Sí. Los votos del chat se cuentan en tu pestaña de anfitrión, así que solo se acumulan mientras esté abierta. Si la cierras a mitad de la votación, el conteo se detiene hasta que la vuelvas a abrir.',
      },
      {
        q: '¿Cuántas personas pueden jugar?',
        a: 'Un bracket admite hasta 16 jugadores eligiendo canciones. No hay límite de cuántas personas pueden votar en el chat.',
      },
      {
        q: '¿Puedo poner la batalla en mi stream?',
        a: 'Sí. Cada sala tiene una pantalla en su propia dirección que lo muestra todo: las entradas, la pelea, las barras de vida, los combos y el conteo de votos en vivo. Ábrela en otra pestaña y compártela como tu stream; puedes revelar canciones y avanzar rondas desde esa pantalla, y los botones se desvanecen cuando dejas de mover el mouse. O pega la misma URL en OBS, Streamlabs o cualquier programa con Browser Source. No necesitas software de transmisión.',
      },
      {
        q: '¿Cuánto dura una batalla?',
        a: 'En modo TuneBoxed los jugadores tienen 90 segundos para elegir por defecto, y cada canción suena 30 segundos. El anfitrión puede cambiar ambos en los ajustes del juego. Classic no tiene reloj de elección: las canciones se fijan antes de que el anfitrión empiece. Un bracket completo de 16 jugadores son cuatro fases, así que calcula entre 15 y 25 minutos, según cuánto tiempo dejes abierta la votación.',
      },
      {
        q: '¿Qué diferencia hay entre Classic y el modo TuneBoxed?',
        a: 'Classic es el preset para un bracket. El anfitrión elige un solo vibe para todo el juego, los jugadores fijan una canción en el lobby sin reloj, y esas son las canciones que se juegan en el bracket. El modo TuneBoxed es el juego en vivo: un vibe aleatorio nuevo en cada ronda y un reloj de elección que define el anfitrión (90 segundos por defecto). Se cambia en los ajustes del juego.',
      },
      {
        q: '¿De dónde salen las canciones?',
        a: 'Los jugadores buscan en el catálogo musical público de Apple, y cada tema suena como un preview de 30 segundos. Nadie necesita suscripción a Spotify o Apple Music.',
      },
      {
        q: '¿Puedo usar SoundCloud o YouTube?',
        a: 'Sí. En vez de buscar, pega un link de SoundCloud o YouTube, y así puedes meter a pelear algo que no está en el catálogo de Apple. Esos temas suenan en los reproductores propios de SoundCloud y YouTube en lugar de como preview, así que el reproductor se queda visible durante el duelo y el arranque es uno o dos segundos menos preciso, sobre todo si YouTube pone un anuncio antes.',
      },
      {
        q: '¿Es gratis?',
        a: 'Sí. Organizar y unirse a una batalla en la web es gratis.',
      },
      {
        q: '¿Qué pasa si alguien se desconecta?',
        a: 'Su lugar se guarda y puede volver a entrar con el mismo link. Si no regresa, la batalla sigue sin esa persona.',
      },
      {
        q: '¿Es lo mismo que la app de iOS?',
        a: 'Usa los mismos servidores. Party en la web es el mismo Battle Mode de la app de iOS: al mejor de tres, con juez que rota. Bracket es el formato para streamers. La app de iOS también tiene un feed musical diario que el sitio web no tiene.',
      },
    ],
    footer:
      '¿Sigues con dudas? Las [reglas del juego](/rules) explican una batalla paso a paso, y la [guía para streamers](/streamers) cubre cómo ponerla en tu stream.',
  },

  streamers: {
    title: 'Para streamers | TuneBoxed',
    description:
      'Pon una batalla de canciones de TuneBoxed en Twitch o TikTok: las canciones salen como boxeadores y el chat escribe 1 o 2 para pegar. Comparte la pantalla o úsala en OBS.',
    heading: 'Para streamers',
    intro: 'Todo lo que necesitas para poner una batalla de canciones en tu stream, y a qué necesita acceso y a qué no.',
    setupHeading: 'Configuración',
    steps: [
      {
        title: 'Inicia sesión con Twitch',
        paragraphs: [
          'Esto es lo que nos dice de qué canal leer los votos, y pone el nombre y el avatar de tu canal en la pantalla.',
        ],
      },
      {
        title: 'Crea una sala',
        paragraphs: ['Recibes un código de cinco letras y un link para unirse. Di el código en voz alta o suelta el link en el chat.'],
      },
      {
        title: 'Pon la pantalla en tu stream',
        paragraphs: [
          'Cada sala tiene una pantalla en su propia dirección, hecha para ser lo que tu audiencia mira. Cada duelo se juega como una pelea de box completa: las entradas, la campana, la pelea, las barras de vida, los combos y el conteo de votos en vivo. Ábrela en otra pestaña y maneja la batalla desde ahí: revela canciones y avanza rondas sin regresar a la sala.',
          '¿No tienes OBS? Comparte esa pestaña como tu stream. Tus botones se desvanecen cuando dejas de mover el mouse, así que no salen en cámara. Funciona en todas las plataformas y no hay que instalar nada.',
          '¿Tienes OBS, Streamlabs o cualquier programa con Browser Source? Pega la misma URL y ajústala a 1920 por 1080. Una Browser Source no tiene sesión iniciada, así que no puede mostrar tus botones. Es una escena completa, no una franja transparente, así que no necesita nada detrás.',
          'Las canciones no suenan en la pantalla hasta que mandes el audio ahí. En Game settings, pon “Sound comes from” en Stream board y luego toca la pantalla una vez para que el navegador pueda reproducir. Ahí también están el control de volumen y la nivelación de canciones.',
        ],
      },
      {
        title: 'Dile al chat que escriba 1 o 2',
        paragraphs: [
          'La pantalla muestra las dos canciones numeradas, con un conteo en vivo. El chat vota escribiendo solo el número, y cada voto es un golpe. La votación se abre cuando suena la campana, después de las dos entradas.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Cómo poner a pelear a tu chat',
        paragraphs: [
          'La pelea premia a un chat que se pone de acuerdo. Tres votos seguidos para una canción es un combo, seis un combo enorme y nueve un mega combo, y la pantalla los canta con la racha. Un voto para la otra canción la rompe, así que un chat que va y viene arma un verdadero agarrón.',
          'Los canales pequeños no se quedan con una pelea lenta. Cuando llegan solo unos cuantos votos, cada uno pega más fuerte en pantalla: con cinco o menos en los últimos 15 segundos, un voto es un combo completo. La pantalla muestra el multiplicador mientras está activo. Nunca cambia el resultado, que siempre se lo lleva la canción con más votos reales.',
          'Una canción que no recibe ningún voto, cuando ya hay cinco, queda noqueada. Si está más cerrado, se va a decisión.',
        ],
      },
      {
        heading: 'Revisa la pantalla antes de salir en vivo',
        paragraphs: [
          '[tuneboxed.com/tv/DEMO1?demo=1](/tv/DEMO1?demo=1) corre una pelea de prueba con canciones y chat inventados, para que la ajustes de tamaño y posición sin tener una batalla en curso. Cualquier código de sala funciona con `?demo=1` al final.',
          'El ring es 3D y corre en cualquier navegador actual, incluidas las fuentes de navegador de OBS y Streamlabs en Windows y Mac. Si el ring se queda en blanco en OBS, revisa que la aceleración por hardware de la fuente de navegador esté activada en Ajustes, Avanzado.',
        ],
      },
      {
        heading: 'Qué puede y qué no puede hacerle a tu canal',
        paragraphs: [
          'El chat se lee de forma anónima, igual que lo lee el navegador de cualquier viewer. Eso significa que ninguna cuenta de bot entra a tu chat, no das permisos de moderador ni de chat, y no existe ningún mecanismo para que TuneBoxed publique un mensaje como si fueras tú. Leer es lo único que hace.',
          'El precio de no usar un servidor es que el conteo pasa en tu pestaña de anfitrión. Los votos solo se acumulan mientras esa pestaña está abierta, así que déjala abierta toda la batalla.',
        ],
      },
      {
        heading: 'Nombres y títulos de canciones',
        paragraphs: [
          'Los nombres de usuario y los títulos de SoundCloud o YouTube se bloquean si usan insultos discriminatorios. Las groserías comunes están permitidas. Los temas del catálogo de Apple Music no se vuelven a filtrar, porque esos títulos ya están en una tienda.',
          'Los ganadores solo se publican en el [tablero público de ganadores](/winners) si tú decides publicarlos, y puedes publicar la canción ganadora sin el nombre de quien ganó.',
        ],
      },
      {
        heading: 'TikTok y otras plataformas',
        paragraphs: [
          'La batalla funciona en cualquier lugar donde puedas compartir un link y compartir pantalla, así que TikTok, Kick, YouTube y Discord van perfecto. La votación por chat es solo para Twitch por ahora, porque depende de leer el chat de Twitch. En todos los demás lados votan los jugadores de la sala, que es también como funciona cuando nadie está en stream.',
        ],
      },
    ],
    footer: '[Inicia una batalla](/battle) o lee las [reglas del juego](/rules).',
  },

  about: {
    title: 'Acerca de | TuneBoxed',
    description:
      'TuneBoxed es un juego musical: batallas de canciones como peleas de box 3D en el navegador, donde cada voto es un golpe, y un feed musical diario en iOS.',
    heading: 'Acerca de TuneBoxed',
    intro: 'Un juego musical sobre lo único por lo que discute todo grupo: quién tiene mejor gusto.',
    battlesHeading: 'Batallas de canciones, peleadas como combates de box',
    battles: [
      'Alguien crea una sala, los demás entran desde un navegador con un código y cada jugador elige una canción. Luego dos canciones suben al ring. Cada una es un boxeador caricaturesco con forma de nota musical que sale con su propio tema, y en cuanto suena la campana, cada voto conecta un golpe. Tres seguidos es un combo. Si una canción no recibe votos, besa la lona. El bracket sigue hasta que queda una sola canción en pie.',
      'Una encuesta te dice quién va ganando. Una pelea hace que todos lo sientan. Cada quien viste a su boxeador en el vestidor, el resto de la sala llena el público, y hasta un chat pequeño tiene una pelea de verdad, porque cada voto pega más fuerte en pantalla cuando llegan menos.',
      'Está hecho para verse en grupo. Las canciones suenan sincronizadas para que todos escuchen lo mismo al mismo tiempo, y cada sala tiene una pantalla que puedes poner en una tele, un proyector o un stream. Si estás en Twitch, la votación puede pasar en el chat que ya tienes en lugar de en una segunda pantalla.',
    ],
    iosHeading: 'La app de iOS',
    ios: 'TuneBoxed nació en iPhone y ahí sigue. Cada día trae un género nuevo, publicas la canción que mejor le queda y la comunidad vota. También hay batallas, incluida Bar for Bar, además de rangos y matches con gente que publica lo mismo que tú.',
    whoHeading: 'Quién lo hace',
    who: 'TuneBoxed está hecho por Aura Brand LLC.',
    footer: '[Inicia una batalla](/battle), lee las [reglas del juego](/rules) o mira el [tablero de ganadores](/winners).',
  },

  winners: {
    title: 'Ganadores | TuneBoxed',
    description: 'Canciones que ganaron un bracket de TuneBoxed. Publicadas por los anfitriones que organizaron las batallas.',
    heading: 'Ganadores',
    intro: 'Canciones que llegaron hasta el final de un bracket completo. Los anfitriones deciden si una batalla aparece aquí.',
    failed: 'No pudimos cargar el tablero de ganadores en este momento. Intenta de nuevo en un rato.',
    loading: 'Cargando el tablero…',
    empty: 'Todavía no hay ganadores publicados. Gana un bracket y podrás poner tu canción aquí. [Inicia una batalla](/battle).',
    pickedBy: 'elegida por {name}',
    room: 'Sala de {name}',
    players: '{count} jugadores',
    footer: 'Lee las [reglas del juego](/rules) o [inicia una batalla](/battle).',
  },
};

export default es;
