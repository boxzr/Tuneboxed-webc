import { useState } from 'react';
import { liveBoardUrl } from '../lib/publicUrl';
import { Card, SectionLabel, VividButton } from './ui/primitives';
import { CopyIcon, ScreenIcon } from './ui/icons';

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
 */
export default function StreamCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = liveBoardUrl(code);

  return (
    <Card className="bt-stream">
      <SectionLabel tone="blue">Show it to your audience</SectionLabel>

      <p className="bt-sub">
        Open the board in another tab and share that tab. Reveal and advance
        from there so you never have to click back here.
      </p>

      <code className="bt-stream__url">{url}</code>

      <div className="bt-stream__row">
        <VividButton
          tone="blue"
          icon={<ScreenIcon size={17} />}
          onClick={() => window.open(url, '_blank', 'noopener')}
        >
          Open the board
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
