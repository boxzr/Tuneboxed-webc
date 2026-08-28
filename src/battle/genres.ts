/**
 * The genre prompts, kept in step with TuneBoxedGenres.swift.
 *
 * These are the game. "Pop" is a category, but "Divorced Dad Rock" is a
 * question people argue about, and the argument is the entertainment. Web
 * rooms used to open every round on a hardcoded "Anything goes", which asked
 * players to pick a song for no reason at all.
 */
export const GENRES = [
  "70's Rock", "80's Disco", 'In an Elevator', 'Beach Day', 'Europe Club',
  'Outdoor Rooftop Bar', 'Raining', '20 Over Speed Limit', 'Divorced Dad Rock',
  'With a Beer', 'Wine Wednesday', 'Frat Party', "2000's Girl Pop", 'Study Music',
  'In an H&M', 'Overhyped', 'Underhyped', "2000's Rap", "80's Synth", 'Gym',
  'Morning Run', 'Sunset', 'Snow Day', 'Nostalgic', '2010 YouTube Intro',
  'Movie Soundtrack', 'Disney', 'Marvel', 'Pay Day', 'Date Night',
  'Late Night Train Stop', 'Library', 'Feels Like Stranger Things', 'At the Mall',
  'Four Story Night Club', 'Walking the Dog', 'Morning Coffee', 'Big City Stroll',
  'Cooking', 'In an Airport', "60's Ice Cream Shop", 'Night in Italy', 'New York',
  'Chicago Rap', 'Memphis Rap', 'ATL Rap', 'UK Drill', 'World Cup',
  'NBA 2K Soundtrack', 'Prom', 'TikTok Song', 'Vine', 'Swing Dance',
  '2016 Rap', 'FIFA Soundtrack', 'Sunday Night Football', 'Barbecue',
  'Grilling Outside', 'Getting Ready to Go Out', 'Shopping', 'You Blast This Home Alone',
  'At a Thrift', 'Late Night Drive', '2013 Rap', 'Drake', 'Pop', 'Rap',
  'Super Bowl Performance', 'Best Riff', 'Sad', 'Denied by Your Crush',
  'Aced an Exam', 'Gameday Hype', '10am Kickoff', 'College Gameday',
  'Cinco de Mayo', "Dad's Favorite", "Mom's Favorite", 'Childhood Favorite', 'On Repeat...',
] as const;

/**
 * A prompt that has not come up yet this room.
 *
 * Repeating one inside a single bracket is the sort of thing a chat notices
 * immediately, so used prompts are passed in and excluded. Once the room has
 * somehow exhausted all of them the pool reopens rather than returning
 * nothing.
 */
export function nextGenre(used: readonly string[] = []): string {
  const fresh = GENRES.filter((g) => !used.includes(g));
  const pool = fresh.length > 0 ? fresh : GENRES;
  return pool[Math.floor(Math.random() * pool.length)];
}
