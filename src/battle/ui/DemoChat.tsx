import type { ChatBadge } from '../twitchChat';
import './demoChat.css';

export interface ChatLine {
  key: string;
  user: string;
  color: string;
  text: string;
  /** Live lines carry what Twitch sent; sample lines get badges made up from the name. */
  badges?: ChatBadge[];
  /** Twitch message id and login, so moderation can find a live line. */
  id?: string | null;
  login?: string;
}

/** Twitch's default name colours, close enough. */
export const NAME_COLORS = ['#ff6b6b', '#4dabf7', '#69db7c', '#ffd43b', '#da77f2', '#ff922b', '#3bc9db', '#f783ac'];

const BADGE_LABEL: Record<ChatBadge, string> = {
  broadcaster: 'Broadcaster',
  moderator: 'Moderator',
  vip: 'VIP',
  subscriber: 'Subscriber',
  premium: 'Prime Gaming',
};

/** Same sample viewer, same badges, every time they post. */
function sampleBadges(user: string): ChatBadge[] {
  let h = 0;
  for (const c of user) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const badges: ChatBadge[] = [];
  if (h % 9 === 0) badges.push('moderator');
  else if (h % 7 === 0) badges.push('vip');
  if (h % 3 !== 1) badges.push('subscriber');
  else if (h % 5 === 0) badges.push('premium');
  return badges;
}

function BadgeIcon({ badge }: { badge: ChatBadge }) {
  return (
    <span className={`demo-chat__badge demo-chat__badge--${badge}`} title={BADGE_LABEL[badge]}>
      <svg viewBox="0 0 18 18" aria-hidden="true">
        {badge === 'broadcaster' && <path d="M2 5h10v8H2zM12.5 8 16 5.5v7L12.5 10Z" />}
        {badge === 'moderator' && <path d="M12.5 2.5 15.5 5.5 8 13 9.5 14.5 8 16 5.5 13.5 3 16 2 15 4.5 12.5 2 10 3.5 8.5 5 10Z" />}
        {badge === 'vip' && <path d="M9 15 2.5 7.5 5 3.5h8l2.5 4Z" />}
        {badge === 'subscriber' && <path d="m9 2.5 2 4.3 4.7.5-3.5 3.2 1 4.6L9 12.7 4.8 15.1l1-4.6L2.3 7.3 7 6.8Z" />}
        {badge === 'premium' && <path d="M2.5 13.5 3.5 5l3.5 3.5L9 4l2 4.5L14.5 5l1 8.5Z" />}
      </svg>
    </span>
  );
}

/**
 * A Twitch-style chat column. Newest line at the bottom. The front-page demo
 * feeds it sample lines; the board feeds it the channel's real chat.
 */
export default function DemoChat({
  channel,
  lines,
  variant = 'demo',
  status,
}: {
  channel: string;
  lines: ChatLine[];
  variant?: 'demo' | 'board';
  /** Shown in place of messages before any arrive. */
  status?: string;
}) {
  return (
    <aside
      className={`demo-chat demo-chat--${variant}`}
      aria-label={variant === 'demo' ? `Sample stream chat for ${channel}` : `Twitch chat for ${channel}`}
    >
      <header className="demo-chat__head">
        <svg className="demo-chat__icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 3h2v14H4zM16 9H10.8l2.6-2.6L12 5l-5 5 5 5 1.4-1.4-2.6-2.6H16z" />
        </svg>
        <span className="demo-chat__title">Stream chat</span>
        <svg className="demo-chat__icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1 16c0-3 2.7-5 6-5s6 2 6 5v1H1Zm13 1v-1c0-1.6-.6-3-1.7-4 .4-.1.8-.1 1.2-.1 2.8 0 4.5 1.6 4.5 4.1v1Z" />
        </svg>
      </header>
      <ol className="demo-chat__lines" aria-hidden={variant === 'demo'}>
        {lines.length === 0 && status && <li className="demo-chat__status">{status}</li>}
        {lines.map((l) => (
          <li key={l.key} className="demo-chat__line">
            {(l.badges ?? sampleBadges(l.user)).map((b) => (
              <BadgeIcon key={b} badge={b} />
            ))}
            <span className="demo-chat__user" style={{ color: l.color }}>
              {l.user}
            </span>
            <span className="demo-chat__colon">: </span>
            <span className={/^[12]$/.test(l.text) ? 'demo-chat__vote' : undefined}>{l.text}</span>
          </li>
        ))}
      </ol>
      <div className="demo-chat__compose" aria-hidden="true">
        <div className="demo-chat__input">
          <span>Type 1 or 2 to punch</span>
          <svg className="demo-chat__icon" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12ZM7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-6.2 2h6.4a3.4 3.4 0 0 1-6.4 0Z" />
          </svg>
        </div>
        <div className="demo-chat__actions">
          <span className="demo-chat__points">
            <svg className="demo-chat__icon" viewBox="0 0 20 20">
              <path d="M10 6a4 4 0 0 1 4 4h-2a2 2 0 0 0-2-2V6Z" />
              <path fillRule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-6 8a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z" />
            </svg>
            1.2K
          </span>
          <span className="demo-chat__send">Chat</span>
        </div>
      </div>
    </aside>
  );
}
