/**
 * Read-only Twitch chat, used to collect votes from viewers.
 *
 * Twitch IRC accepts anonymous connections under a justinfan nick, which
 * means reading a channel needs no OAuth token, no bot account and no chat
 * scopes on the streamer's login. Reading is all this does; it never sends a
 * message, so there is nothing here that could post as the streamer.
 *
 * This runs in the host's tab. Chat therefore only counts while that tab is
 * open, which is the trade for not running a server.
 */

const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';

export interface ChatMessage {
  /** Lowercase Twitch login of the sender. */
  user: string;
  text: string;
}

/**
 * Pull the sender and body out of a raw IRC line.
 *
 * Returns null for anything that is not a channel message, which covers the
 * membership and capability chatter Twitch sends around the actual chat.
 *
 * Exported for tests: this is fiddly string handling and it is the part most
 * likely to quietly stop matching if Twitch changes its prefixes.
 */
export function parsePrivmsg(line: string): ChatMessage | null {
  // Tags arrive as a leading @key=value;... segment when capabilities are
  // requested. None are requested here, but a line carrying them should still
  // parse rather than being dropped.
  let rest = line.startsWith('@') ? line.slice(line.indexOf(' ') + 1) : line;
  if (!rest.startsWith(':')) return null;

  const space = rest.indexOf(' ');
  if (space === -1) return null;

  const prefix = rest.slice(1, space);
  rest = rest.slice(space + 1);

  if (!rest.startsWith('PRIVMSG ')) return null;

  const bang = prefix.indexOf('!');
  const user = (bang === -1 ? prefix : prefix.slice(0, bang)).toLowerCase();
  if (!user) return null;

  // PRIVMSG #channel :the message
  const colon = rest.indexOf(' :');
  if (colon === -1) return null;

  return { user, text: rest.slice(colon + 2).trim() };
}

export type ChatBadge = 'broadcaster' | 'moderator' | 'vip' | 'subscriber' | 'premium';

const KNOWN_BADGES: readonly ChatBadge[] = ['broadcaster', 'moderator', 'vip', 'subscriber', 'premium'];

/** A chat message as the board's chat column shows it. */
export interface ChatPost {
  /** Twitch's message id, so a mod deleting it can take it off the board. */
  id: string | null;
  /** Lowercase login, for timeouts and bans. */
  user: string;
  /** The name as the viewer styled it. */
  name: string;
  /** Their chosen name colour, or null for viewers who never set one. */
  color: string | null;
  badges: ChatBadge[];
  text: string;
}

function parseTags(line: string): Record<string, string> {
  if (!line.startsWith('@')) return {};
  const tags: Record<string, string> = {};
  for (const pair of line.slice(1, line.indexOf(' ')).split(';')) {
    const eq = pair.indexOf('=');
    if (eq > 0) tags[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return tags;
}

/** IRCv3 escapes in tag values, which is how a display name could carry a space. */
function unescapeTag(value: string): string {
  return value.replace(/\\(.)/g, (_, c: string) => (c === 's' ? ' ' : c === ':' ? ';' : c === '\\' ? '\\' : ''));
}

/**
 * A chat line with the sender's styling, for showing chat rather than counting it.
 * Needs the twitch.tv/tags capability for colour, badges and id; without it
 * those come back empty and the line still shows.
 */
export function parseChatPost(line: string): ChatPost | null {
  const msg = parsePrivmsg(line);
  if (!msg) return null;
  const tags = parseTags(line);
  // /me arrives wrapped in CTCP ACTION markers.
  const action = /^\u0001ACTION (.*)\u0001?$/.exec(msg.text);
  const badges = (tags.badges ?? '')
    .split(',')
    .map((b) => b.split('/')[0] as ChatBadge)
    .filter((b) => KNOWN_BADGES.includes(b));
  return {
    id: tags.id || null,
    user: msg.user,
    name: unescapeTag(tags['display-name'] ?? '') || msg.user,
    color: /^#[0-9a-f]{6}$/i.test(tags.color ?? '') ? tags.color : null,
    badges,
    text: action ? action[1].replace(/\u0001$/, '') : msg.text,
  };
}

/**
 * Moderation that should take lines off a chat display. A ban or timeout
 * names a user, a single deletion names a message, and a bare CLEARCHAT
 * (`/clear`) wipes everything.
 */
export type ChatClear = { all: true } | { user: string } | { id: string };

export function parseClear(line: string): ChatClear | null {
  const tags = parseTags(line);
  const rest = line.startsWith('@') ? line.slice(line.indexOf(' ') + 1) : line;
  const parts = rest.split(' ');
  if (parts[1] === 'CLEARMSG') return tags['target-msg-id'] ? { id: tags['target-msg-id'] } : null;
  if (parts[1] !== 'CLEARCHAT') return null;
  const colon = rest.indexOf(' :');
  return colon === -1 ? { all: true } : { user: rest.slice(colon + 2).trim().toLowerCase() };
}

/**
 * Read a vote out of a chat message.
 *
 * Deliberately strict. Chat during a battle is full of ordinary talk, and
 * counting "1" inside "that was 1 of the best" would quietly corrupt the
 * result, so only a message that is exactly the digit counts.
 */
export function parseVote(text: string, options: number): number | null {
  const trimmed = text.trim();
  if (!/^[0-9]+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > options) return null;
  return n;
}

export interface ChatConnection {
  close: () => void;
}

/**
 * Join a channel and stream messages to `onMessage` until closed.
 *
 * Reconnects with a backoff, because a battle runs for many minutes and a
 * socket that drops silently would look identical to a chat that stopped
 * voting.
 */
export function connectToChat(
  channel: string,
  onMessage: (msg: ChatMessage) => void,
  onStatus?: (connected: boolean) => void,
  /** Every raw line, with tags requested, for a reader that shows chat rather than counts it. */
  onLine?: (line: string) => void
): ChatConnection {
  let socket: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const open = () => {
    if (closed) return;
    socket = new WebSocket(IRC_URL);

    socket.onopen = () => {
      attempt = 0;
      // Any justinfan nick is accepted anonymously. The suffix is random so
      // two tabs on the same machine do not collide.
      if (onLine) socket?.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      socket?.send(`NICK justinfan${Math.floor(Math.random() * 100000)}`);
      socket?.send(`JOIN #${channel.toLowerCase()}`);
      onStatus?.(true);
    };

    socket.onmessage = (event) => {
      for (const line of String(event.data).split('\r\n')) {
        if (!line) continue;
        // Twitch drops the connection if pings go unanswered.
        if (line.startsWith('PING')) {
          socket?.send('PONG :tmi.twitch.tv');
          continue;
        }
        onLine?.(line);
        const msg = parsePrivmsg(line);
        if (msg) onMessage(msg);
      }
    };

    socket.onclose = () => {
      onStatus?.(false);
      if (closed) return;
      // Capped so a channel that is offline for a while does not turn into a
      // reconnect loop hammering Twitch.
      const wait = Math.min(30_000, 1000 * 2 ** attempt++);
      retry = setTimeout(open, wait);
    };

    socket.onerror = () => socket?.close();
  };

  open();

  return {
    close: () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    },
  };
}
