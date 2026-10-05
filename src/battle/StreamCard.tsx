import { useState } from 'react';
import { liveBoardUrl } from '../lib/publicUrl';
import { readString, writeString } from './prefs';
import { Card, SectionLabel, VividButton } from './ui/primitives';
import { CopyIcon, ScreenIcon } from './ui/icons';

const CHAT_KEY = 'tuneboxed-board-chat';
const CHANNEL_KEY = 'tuneboxed-board-chat-channel';

/**
 * How to get the battle in front of an audience. Host only, since nobody else
 * can act on it.
 *
 * Sharing the board is the headline rather than the fallback. It needs no
 * software, works on every platform rather than only the ones with a browser
 * source, and the board is designed to be looked at. The OBS route is offered
 * second, for people who already have a scene they want this inside.
 *
 * The host who opens this URL in their own browser also gets the controls,
 * so they can reveal and advance without clicking back to this room tab.
 *
 * Twitch chat on the board is part of the URL rather than a room setting, so
 * the same link works in a shared tab and in an OBS Browser Source.
 */
export default function StreamCard({ code, channel }: { code: string; channel: string | null }) {
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(() => readString(CHAT_KEY, '0') === '1');
  const [typedChannel, setTypedChannel] = useState(() => readString(CHANNEL_KEY, ''));

  const chatName = channel ?? typedChannel.trim().replace(/^#/, '').toLowerCase();
  const chatParam = !showChat || !/^[a-z0-9_]{3,25}$/.test(chatName) ? '' : channel ? '1' : chatName;
  const url = liveBoardUrl(code) + (chatParam ? `?chat=${chatParam}` : '');

  return (
    <Card className="bt-stream">
      <SectionLabel tone="blue">Show it to your audience</SectionLabel>

      <p className="bt-sub">
        Open the fight in another tab and share that tab. Reveal and advance
        from there so you never have to click back here.
      </p>

      <label className="bt-stream__opt">
        <input
          type="checkbox"
          checked={showChat}
          onChange={(e) => {
            setShowChat(e.target.checked);
            writeString(CHAT_KEY, e.target.checked ? '1' : '0');
          }}
        />
        Show Twitch chat on the board
      </label>

      {showChat && !channel && (
        <input
          className="battle-input bt-stream__channel"
          type="text"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Your Twitch channel"
          aria-label="Twitch channel"
          value={typedChannel}
          maxLength={26}
          onChange={(e) => {
            setTypedChannel(e.target.value);
            writeString(CHANNEL_KEY, e.target.value);
          }}
        />
      )}

      <code className="bt-stream__url">{url}</code>

      <div className="bt-stream__row">
        <VividButton
          tone="blue"
          icon={<ScreenIcon size={17} />}
          onClick={() => window.open(url, '_blank', 'noopener')}
        >
          Watch the fight
        </VividButton>

        <VividButton
          tone="blue"
          variant="outline"
          icon={<CopyIcon size={16} />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard can be blocked; the URL is on screen to copy by hand */
            }
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </VividButton>
      </div>

      <p className="bt-sub bt-stream__obs">
        Buttons fade when you stop moving. For OBS, paste the same URL as a
        1920×1080 Browser Source.
      </p>
    </Card>
  );
}
