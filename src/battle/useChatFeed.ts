import { useEffect, useState } from 'react';
import { connectToChat, parseChatPost, parseClear, type ChatPost } from './twitchChat';
import { NAME_COLORS, type ChatLine } from './ui/DemoChat';

/** Enough to fill a tall column; older lines have long scrolled away. */
const KEEP = 60;
/** Busy chats are drawn in batches rather than a render per message. */
const FLUSH_MS = 250;

/** Twitch picks a colour for viewers who never chose one; this stands in for it. */
function fallbackColor(user: string): string {
  let h = 0;
  for (const c of user) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

/** Twitch lifts dark name colours on its dark theme; pure blue on #18181b is unreadable otherwise. */
function readable(hex: string): string {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (lum >= 0.45) return hex;
  const mix = Math.min(0.75, (0.45 - lum) / (1 - lum) + 0.15);
  return `rgb(${rgb.map((c) => Math.round(c + (255 - c) * mix)).join(', ')})`;
}

/**
 * A channel's live chat, read anonymously, for showing on the board. Messages
 * a mod deletes and users who get timed out or banned come straight back off,
 * since this is going out on stream.
 */
export function useChatFeed(channel: string | null): { lines: ChatLine[]; connected: boolean } {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setLines([]);
    if (!channel) return;
    let pending: ChatLine[] = [];
    let seq = 0;
    const toLine = (p: ChatPost): ChatLine => ({
      key: `live-${seq++}`,
      id: p.id,
      login: p.user,
      user: p.name,
      color: p.color ? readable(p.color) : fallbackColor(p.user),
      badges: p.badges,
      text: p.text,
    });

    const conn = connectToChat(
      channel,
      () => undefined,
      setConnected,
      (raw) => {
        const clear = parseClear(raw);
        if (clear) {
          const keep = (l: ChatLine) =>
            !('all' in clear) && ('user' in clear ? l.login !== clear.user : l.id !== clear.id);
          pending = pending.filter(keep);
          setLines((prev) => prev.filter(keep));
          return;
        }
        const post = parseChatPost(raw);
        if (post) pending.push(toLine(post));
      }
    );

    const flush = setInterval(() => {
      if (pending.length === 0) return;
      const batch = pending;
      pending = [];
      setLines((prev) => [...prev, ...batch].slice(-KEEP));
    }, FLUSH_MS);

    return () => {
      conn.close();
      clearInterval(flush);
      setConnected(false);
    };
  }, [channel]);

  return { lines, connected };
}
