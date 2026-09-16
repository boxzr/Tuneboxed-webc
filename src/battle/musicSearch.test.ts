import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, mergeSongs, relevance, tidy, type Song } from './musicSearch.ts';

const song = (title: string, artist: string, source: Song['source'] = 'itunes'): Song => ({
  title,
  artist,
  artworkUrl: null,
  previewUrl: 'https://example.com/p.m4a',
  externalId: `${source}-${title}`,
  source,
});

test('strips "by" so a typed sentence becomes a catalogue query', () => {
  assert.equal(tidy('freestyle 8 by dee mula'), 'freestyle 8 dee mula');
});

test('Dee Mula and Deemula are the same artist once folded', () => {
  assert.equal(fold('Dee Mula'), fold('Deemula'));
});

test('the song that matches the whole query ranks above a same-artist miss', () => {
  const query = 'freestyle 8 dee mula';
  assert.ok(
    relevance(query, 'Freestyle 8', 'DeeMula') >
      relevance(query, 'Blow My High', 'Dee Mula')
  );
});

test('a Deezer hit for the typed song sits above iTunes junk', () => {
  const merged = mergeSongs('freestyle 8 dee mula', [song('Blow My High', 'Dee Mula')], [
    song('Freestyle 8', 'DeeMula', 'deezer'),
  ]);
  assert.equal(merged[0].title, 'Freestyle 8');
  assert.equal(merged[0].source, 'deezer');
});

test('the same song from both catalogues keeps the iTunes row', () => {
  const merged = mergeSongs('blinding lights', [song('Blinding Lights', 'The Weeknd')], [
    song('Blinding Lights', 'The Weeknd', 'deezer'),
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].source, 'itunes');
});
