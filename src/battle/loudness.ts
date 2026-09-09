/**
 * Levels the songs in a round against each other.
 *
 * Every iTunes preview is mastered differently: a 2019 rap single sits a good
 * ten decibels above a 1970s folk record, and a room that plays them back to
 * back at the same volume setting hears one song as a wall and the next as a
 * whisper. Streamers noticed, because it is their stream's audio.
 *
 * Apple's preview CDN allows cross-origin reads, so the clip can be fetched
 * and decoded here, its RMS level measured, and a gain worked out that brings
 * it to a common target. The gain is applied to the media element's volume
 * along with the host's own setting, so every song in a set lands at roughly
 * the same loudness without anyone riding a fader.
 *
 * RMS rather than a full LUFS measurement. The K-weighting and gating in
 * BS.1770 matter when the target is broadcast compliance; here the target is
 * two songs sounding like they came from the same playlist, and plain RMS
 * gets within a decibel or two of that for a thirty second pop clip.
 */

/**
 * Where every clip is brought to, as linear RMS. About -18 dBFS, which is a
 * typical level for a mastered pop record's preview and leaves headroom so
 * the quieter songs can be lifted without the loud ones having to be pinned.
 */
const TARGET_RMS = 0.125;

/**
 * How far a clip may be moved. A clip so quiet that it wants more than
 * MAX_GAIN is probably a fade-in or a spoken intro, and pushing it further
 * would just make the next loud hit painful.
 */
export const MIN_GAIN = 0.3;
export const MAX_GAIN = 2.5;

/** One measurement per URL per page, however many rounds play the song. */
const cache = new Map<string, Promise<number>>();

/**
 * Gain to multiply the media element's volume by so this clip lands at the
 * target. 1 when the clip cannot be measured, which plays it as it always did.
 */
export function loudnessGain(previewUrl: string): Promise<number> {
  const hit = cache.get(previewUrl);
  if (hit) return hit;
  const measured = measure(previewUrl).catch(() => 1);
  cache.set(previewUrl, measured);
  return measured;
}

async function measure(url: string): Promise<number> {
  if (typeof OfflineAudioContext === 'undefined' && typeof AudioContext === 'undefined') return 1;

  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) return 1;
  const bytes = await res.arrayBuffer();

  // An offline context decodes without needing a user gesture, unlike a live
  // one, and never touches the speakers.
  const Ctx =
    typeof OfflineAudioContext !== 'undefined'
      ? OfflineAudioContext
      : (AudioContext as unknown as typeof OfflineAudioContext);
  const ctx = new Ctx(1, 1, 44100);
  const buffer = await ctx.decodeAudioData(bytes);

  let sum = 0;
  let count = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    // Every fourth sample is plenty for a level estimate and keeps the loop
    // short on a thirty second stereo buffer.
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] * data[i];
      count++;
    }
  }
  if (count === 0) return 1;

  const rms = Math.sqrt(sum / count);
  if (rms <= 0) return 1;

  return Math.min(MAX_GAIN, Math.max(MIN_GAIN, TARGET_RMS / rms));
}
