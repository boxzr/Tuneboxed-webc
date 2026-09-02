import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneForGenre } from './sceneForGenre.ts';

test('named prompts map to the matching atmosphere', () => {
  assert.equal(sceneForGenre('Sunset'), 'sunset');
  assert.equal(sceneForGenre('2016 Rap'), 'rap');
  assert.equal(sceneForGenre('Feels Like Stranger Things'), 'stranger');
  assert.equal(sceneForGenre('Beach Day'), 'beach');
  assert.equal(sceneForGenre('Gym'), 'gym');
  assert.equal(sceneForGenre('Raining'), 'rain');
  assert.equal(sceneForGenre('Snow Day'), 'snow');
  assert.equal(sceneForGenre("70's Rock"), 'rock');
  assert.equal(sceneForGenre('Date Night'), 'romance');
  assert.equal(sceneForGenre('Morning Coffee'), 'cozy');
  assert.equal(sceneForGenre('New York'), 'city');
  assert.equal(sceneForGenre('Movie Soundtrack'), 'cinema');
  assert.equal(sceneForGenre('Wine Wednesday'), 'warm');
});

test('a custom vibe with no keyword still gets a board, not a blank', () => {
  assert.equal(sceneForGenre('one-hit wonders'), 'default');
});

test('an empty prompt paints nothing', () => {
  assert.equal(sceneForGenre(null), null);
  assert.equal(sceneForGenre('   '), null);
});
