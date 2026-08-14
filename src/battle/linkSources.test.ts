import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLink } from './linkSources.ts';

test('reads a video id out of a standard YouTube watch URL', () => {
  assert.deepEqual(parseLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), {
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });
});

test('handles a youtu.be short link', () => {
  assert.equal(parseLink('https://youtu.be/dQw4w9WgXcQ')?.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('keeps the id when the URL carries a timestamp and tracking junk', () => {
  const link = parseLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&si=abc123');
  assert.equal(link?.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('accepts shorts, music and mobile YouTube hosts', () => {
  for (const url of [
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  ]) {
    assert.equal(parseLink(url)?.source, 'youtube', url);
  }
});

test('rejects a YouTube id that is the wrong length', () => {
  assert.equal(parseLink('https://www.youtube.com/watch?v=tooshort'), null);
});

test('rejects a YouTube channel or playlist page', () => {
  assert.equal(parseLink('https://www.youtube.com/@RickAstleyYT'), null);
  assert.equal(parseLink('https://www.youtube.com/playlist?list=PL1234'), null);
});

test('normalises a SoundCloud track URL down to user and slug', () => {
  assert.deepEqual(parseLink('https://soundcloud.com/forss/flickermood?in=someone/sets/x&utm_source=y'), {
    source: 'soundcloud',
    url: 'https://soundcloud.com/forss/flickermood',
  });
});

test('accepts a bare paste with no scheme', () => {
  assert.equal(parseLink('soundcloud.com/forss/flickermood')?.source, 'soundcloud');
});

test('rejects a SoundCloud profile, which is not a single track', () => {
  assert.equal(parseLink('https://soundcloud.com/forss'), null);
});

test('rejects a SoundCloud playlist', () => {
  assert.equal(parseLink('https://soundcloud.com/forss/sets/soulhack'), null);
});

test('rejects a SoundCloud short link, whose redirect cannot be followed here', () => {
  assert.equal(parseLink('https://on.soundcloud.com/abc123'), null);
});

test('rejects unrelated hosts and nonsense', () => {
  for (const input of [
    'https://open.spotify.com/track/abc',
    'https://example.com/song',
    'not a url at all',
    '',
    '   ',
  ]) {
    assert.equal(parseLink(input), null, JSON.stringify(input));
  }
});
