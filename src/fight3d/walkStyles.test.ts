import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WALK_STYLES, pickWalkStyles } from './walkStyles.ts';

test('the two corners never get the same walkout', () => {
  for (let i = 0; i < 500; i++) {
    const { a, b } = pickWalkStyles(`round-${i}`);
    assert.notEqual(a, b);
  }
});

test('the same fight always picks the same walkouts', () => {
  assert.deepEqual(pickWalkStyles('room-7'), pickWalkStyles('room-7'));
});

test('every style shows up for both corners across fights', () => {
  const seenA = new Set<string>();
  const seenB = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const { a, b } = pickWalkStyles(`fight-${i}`);
    seenA.add(a);
    seenB.add(b);
  }
  assert.equal(seenA.size, WALK_STYLES.length);
  assert.equal(seenB.size, WALK_STYLES.length);
});
