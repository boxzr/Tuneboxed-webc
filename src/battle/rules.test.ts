import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIP_MAX,
  CLIP_MIN,
  CLIP_SECONDS,
  CLIP_STEP,
  PICK_SECONDS,
  PREVIEW_SECONDS,
  clampClipSeconds,
  clampClipStart,
  clampPickSeconds,
  clipIndex,
  clipLabel,
  clipsFinished,
  maxClipStart,
} from './rules.ts';

test('a pick clock is ninety seconds', () => {
  assert.equal(PICK_SECONDS, 90);
});

test('a pick clock of zero means no clock', () => {
  assert.equal(clampPickSeconds(0), 0);
});

test('a clip is thirty seconds', () => {
  assert.equal(CLIP_SECONDS, 30);
});

test('the first song holds until 30 seconds, then the next one starts', () => {
  assert.equal(clipIndex(0, 2), 0);
  assert.equal(clipIndex(29.9, 2), 0);
  assert.equal(clipIndex(30, 2), 1);
  assert.equal(clipIndex(59.9, 2), 1);
});

test('the set is finished only after every clip has had its window', () => {
  assert.equal(clipsFinished(29.9, 2), false);
  assert.equal(clipsFinished(30, 2), false);
  assert.equal(clipsFinished(60, 2), true);
});

test('a host dragging the clip longer changes when each song hands over', () => {
  assert.equal(clipIndex(29, 2, 30), 0);
  assert.equal(clipIndex(30, 2, 30), 1);
  assert.equal(clipsFinished(59, 2, 30), false);
  assert.equal(clipsFinished(60, 2, 30), true);
});

test('the default clip sits inside the range the slider offers', () => {
  assert.ok(CLIP_SECONDS >= CLIP_MIN && CLIP_SECONDS <= CLIP_MAX);
  assert.equal(CLIP_SECONDS % CLIP_STEP, 0);
});

test('a clip length outside the range is pulled back to the ends', () => {
  assert.equal(clampClipSeconds(0), CLIP_MIN);
  assert.equal(clampClipSeconds(-30), CLIP_MIN);
  assert.equal(clampClipSeconds(600), CLIP_MAX);
});

test('a clip can never outrun the thirty second preview it plays from', () => {
  // Asking for more than the preview holds would buy silence, not more song.
  assert.equal(CLIP_MAX, PREVIEW_SECONDS);
  assert.equal(clampClipSeconds(45), PREVIEW_SECONDS);
});

test('the full length clip has to start at the beginning', () => {
  assert.equal(maxClipStart(PREVIEW_SECONDS), 0);
});

test('a shorter clip is what buys room to move the start', () => {
  assert.equal(maxClipStart(15), 15);
  assert.equal(maxClipStart(10), 20);
});

test('a start that would run past the end of the preview is pulled back', () => {
  assert.equal(clampClipStart(25, 15), 15);
  assert.equal(clampClipStart(-5, 15), 0);
  // Dragging the length up has to drag an out-of-range start down with it.
  assert.equal(clampClipStart(20, PREVIEW_SECONDS), 0);
});

test('a clip always finishes inside the preview, whatever the pair', () => {
  for (let clip = CLIP_MIN; clip <= CLIP_MAX; clip += CLIP_STEP) {
    for (let start = 0; start <= PREVIEW_SECONDS; start += CLIP_STEP) {
      const safe = clampClipStart(start, clip);
      assert.ok(
        safe + clip <= PREVIEW_SECONDS,
        `${safe}s start + ${clip}s clip overruns the preview`
      );
    }
  }
});

test('an off-step clip length snaps to the nearest step', () => {
  assert.equal(clampClipSeconds(17), 15);
  assert.equal(clampClipSeconds(18), 20);
  assert.equal(clampClipSeconds(23), 25);
});

test('a corrupt stored clip length falls back to the default', () => {
  assert.equal(clampClipSeconds(Number.NaN), CLIP_SECONDS);
  assert.equal(clampClipSeconds(Number.POSITIVE_INFINITY), CLIP_SECONDS);
});

test('the clip length reads as prose rather than a bare number', () => {
  assert.equal(clipLabel(15), '15 seconds');
  assert.equal(clipLabel(60), 'a full minute');
});
