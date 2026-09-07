import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KO_QUORUM, fightScore, fightVerdict } from './fight.ts';

test('nobody has voted yet, so both songs are on full health', () => {
  const score = fightScore(0, 0);
  assert.equal(score.healthA, 100);
  assert.equal(score.healthB, 100);
  assert.equal(score.leader, null);
  assert.equal(score.knockout, false);
});

test('a level fight leaves both on full health however many votes are in', () => {
  const score = fightScore(40, 40);
  assert.equal(score.healthA, 100);
  assert.equal(score.healthB, 100);
  assert.equal(score.leader, null);
});

test('the first vote lands a visible hit without ending the fight', () => {
  const score = fightScore(1, 0);
  assert.equal(score.leader, 'a');
  assert.equal(score.healthA, 100);
  // One fifth of quorum turned out, so it takes a fifth of the bar.
  assert.equal(score.healthB, 80);
  assert.equal(score.knockout, false);
});

test('a shutout at quorum is a knockout', () => {
  const score = fightScore(0, KO_QUORUM);
  assert.equal(score.leader, 'b');
  assert.equal(score.healthB, 100);
  assert.equal(score.healthA, 0);
  assert.equal(score.knockout, true);
  assert.equal(fightVerdict(score), 'Knockout');
});

test('a close fight in a busy chat goes to a decision, not a knockout', () => {
  const score = fightScore(128, 74);
  assert.equal(score.leader, 'a');
  assert.equal(score.healthA, 100);
  assert.equal(score.healthB, 73);
  assert.equal(score.knockout, false);
  assert.equal(fightVerdict(score), 'Wins by decision');
});

test('health tracks the share of the vote, not the size of the gap', () => {
  // Same 4:1 split, wildly different turnout: the fight should look the same.
  assert.equal(fightScore(8, 2).healthB, fightScore(80, 20).healthB);
});

test('a big room that shuts one song out still only reaches zero', () => {
  const score = fightScore(500, 0);
  assert.equal(score.healthB, 0);
  assert.equal(score.knockout, true);
});

test('negative tallies cannot happen but must not produce negative health', () => {
  const score = fightScore(-3, 5);
  assert.ok(score.healthA >= 0 && score.healthA <= 100);
  assert.ok(score.healthB >= 0 && score.healthB <= 100);
});
