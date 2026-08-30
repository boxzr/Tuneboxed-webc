import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLIP_SECONDS, clipIndex, clipsFinished } from './rules.ts';

test('a clip is fifteen seconds', () => {
  assert.equal(CLIP_SECONDS, 15);
});

test('the first song holds until 15 seconds, then the next one starts', () => {
  assert.equal(clipIndex(0, 2), 0);
  assert.equal(clipIndex(14.9, 2), 0);
  assert.equal(clipIndex(15, 2), 1);
  assert.equal(clipIndex(29.9, 2), 1);
});

test('the set is finished only after every clip has had its window', () => {
  assert.equal(clipsFinished(14.9, 2), false);
  assert.equal(clipsFinished(15, 2), false);
  assert.equal(clipsFinished(30, 2), true);
});
