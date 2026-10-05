import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultLoadout, encodeLoadout, parseLoadout } from './loadout.ts';

test('a name hashes to a stable kit', () => {
  assert.deepEqual(defaultLoadout('chrispat7002'), defaultLoadout('chrispat7002'));
  assert.notDeepEqual(defaultLoadout('chrispat7002'), defaultLoadout('boxer'));
});

test('encode then parse is a round trip', () => {
  const kit = defaultLoadout('ashley');
  assert.deepEqual(parseLoadout(encodeLoadout(kit), 'ashley'), kit);
});

test('junk or empty seed falls back to the name hash', () => {
  assert.deepEqual(parseLoadout(null, 'marcus'), defaultLoadout('marcus'));
  assert.deepEqual(parseLoadout('not-a-kit', 'marcus'), defaultLoadout('marcus'));
});
