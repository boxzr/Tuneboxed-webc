/**
 * Which atmosphere the board should paint for a prompt.
 *
 * Live image search kept returning junk that had nothing to do with the
 * vibe. These families are ours, so Sunset is a sunset and Rap is a night
 * city, not a random Commons file.
 */

export type SceneId =
  | 'sunset'
  | 'night'
  | 'stranger'
  | 'beach'
  | 'rain'
  | 'snow'
  | 'gym'
  | 'rap'
  | 'rock'
  | 'club'
  | 'city'
  | 'cozy'
  | 'romance'
  | 'sad'
  | 'cinema'
  | 'warm'
  | 'default';

const RULES: readonly [RegExp, SceneId][] = [
  [/stranger things/i, 'stranger'],
  [/late night|night drive|train stop|night in|home alone/i, 'night'],
  [/sunset|golden/i, 'sunset'],
  [/beach|summer|ice cream/i, 'beach'],
  [/rain/i, 'rain'],
  [/snow/i, 'snow'],
  [/gym|run|gameday|football|fifa|nba|world cup|kickoff|college|speed limit/i, 'gym'],
  [/rap|drill|drake|hip hop|frat|overhyped|underhyped/i, 'rap'],
  [/rock|riff|synth|disco|divorced dad/i, 'rock'],
  [/club|rooftop|party|getting ready|tiktok|vine|prom|youtube/i, 'club'],
  [/new york|chicago|city|mall|airport|h&m|thrift|shopping|elevator/i, 'city'],
  [/coffee|library|study|cooking|morning|walking the dog/i, 'cozy'],
  [/date night|italy|crush/i, 'romance'],
  [/sad|denied/i, 'sad'],
  [/disney|marvel|movie|soundtrack/i, 'cinema'],
  [/wine|beer|barbecue|grilling|cinco|pay day|nostalgic|childhood|mom|dad|on repeat/i, 'warm'],
];

/** The scene family for this prompt. Unknown custom text falls back to default. */
export function sceneForGenre(genre: string | null | undefined): SceneId | null {
  const key = genre?.trim();
  if (!key) return null;
  for (const [pattern, scene] of RULES) {
    if (pattern.test(key)) return scene;
  }
  return 'default';
}
