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
  onStatus?: (connected: boolean) => void
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
