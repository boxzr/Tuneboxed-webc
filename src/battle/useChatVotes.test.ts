import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addPunch, mergePunches, punchesAllowed } from './chatPunches.ts';

test('each 1 adds a punch instead of moving a single ballot', () => {
  let counts = addPunch({}, 'song-a');
  counts = addPunch(counts, 'song-a');
  counts = addPunch(counts, 'song-b');
  assert.deepEqual(counts, { 'song-a': 2, 'song-b': 1 });
});

test('a board that just opened keeps the higher running tally', () => {
  const merged = mergePunches({ a: 2, b: 1 }, { a: 5, b: 0, c: 3 });
  assert.deepEqual(merged, { a: 5, b: 1, c: 3 });
});

test('one login cannot throw more than eight punches a second', () => {
  let recent: number[] = [];
  let ok = 0;
  for (let i = 0; i < 12; i++) {
    const next = punchesAllowed(recent, 1000 + i);
    recent = next.recent;
    if (next.ok) ok += 1;
  }
  assert.equal(ok, 8);
  const later = punchesAllowed(recent, 1000 + 1001);
  assert.equal(later.ok, true);
});
