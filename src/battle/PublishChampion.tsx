import { useState } from 'react';
import * as battle from '../lib/battleClient';
import { VividButton } from './ui/primitives';

/**
 * Offers the host the winners board.
 *
 * battle_publish_champion and the winners page have both existed for a while
 * with nothing in between them: no screen ever called the function, so the
 * board could never have anything on it. This is that missing step.
 *
 * Deliberately a button rather than something that fires on its own when the
 * final lands. The board is public and the page says hosts choose what goes
 * on it, so publishing somebody's room off the back of simply finishing a
 * game would be making that choice for them.
 *
 * The name is a second, separate opt-in. The winning song is about the music;
 * the display name is about a person, and a host who wants to show the song
 * has not thereby agreed to be named next to it.
 */
export default function PublishChampion({ token }: { token: string }) {
  const [includeName, setIncludeName] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');

  const publish = async () => {
    setState('sending');
    try {
      await battle.publishChampion(token, includeName);
      setState('done');
    } catch {
      setState('failed');
    }
  };

  if (state === 'done') {
    return (
      <p className="bt-sub bt-sub--center">
        On the <a href="/winners">winners board</a>.
      </p>
    );
  }

  return (
    <div className="bt-publish">
      <label className="bt-publish__opt">
        <input
          type="checkbox"
          checked={includeName}
          onChange={(e) => setIncludeName(e.target.checked)}
        />
        Show the winner&rsquo;s name too
      </label>

      <VividButton disabled={state === 'sending'} variant="outline" onClick={publish}>
        {state === 'sending' ? 'Publishing…' : 'Put this song on the winners board'}
      </VividButton>

      {state === 'failed' && (
        <p className="bt-sub bt-sub--center">
          That did not go through. Try again in a moment.
        </p>
      )}
    </div>
  );
}
