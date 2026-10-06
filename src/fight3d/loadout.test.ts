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

test('a look saved before dances still parses, and picks a dance from the name', () => {
  const old = parseLoadout('tb1.1.5.1.0.0.6.1', 'ashley');
  assert.equal(old.body, 'mid');
  assert.equal(old.dance, defaultLoadout('ashley').dance);
});

test('the chosen dance survives a round trip', () => {
  const kit = { ...defaultLoadout('ashley'), dance: 'griddy' as const };
  assert.equal(parseLoadout(encodeLoadout(kit), 'someone-else').dance, 'griddy');
});
