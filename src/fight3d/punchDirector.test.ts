import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_WINDOW_MS,
  HEAT_MAX,
  emptyDirector,
  voteBoost,
  kindForBurst,
  posesFor,
  tickDirector,
} from './punchDirector.ts';

test('the first tally is a starting position, not a punch', () => {
  const { event, state } = tickDirector(emptyDirector(), 0, 0);
  assert.equal(event, null);
  assert.equal(state.votesA, 0);
  assert.equal(state.heatA, 0);
});

test('a single new vote is a jab', () => {
  const start = tickDirector(emptyDirector(), 0, 0).state;
  const { event, state } = tickDirector(start, 1, 0);
  assert.equal(event?.side, 'a');
  assert.equal(event?.kind, 'jab');
  assert.equal(state.heatA, 1);
  assert.equal(state.heatB, 0);
});

test('a two-vote burst is a heavier punch than a jab', () => {
  const start = tickDirector(emptyDirector(), 3, 2).state;
  const { event } = tickDirector(start, 5, 2);
  assert.equal(event?.side, 'a');
  assert.ok(['hook', 'cross', 'body', 'uppercut'].includes(event!.kind));
});

test('a four-vote burst after a vote for the other corner is a combo', () => {
  const start = tickDirector(emptyDirector(), 1, 0).state;
  const { event } = tickDirector(start, 1, 4);
  assert.equal(event?.side, 'b');
  assert.equal(event?.kind, 'combo');
  assert.equal(event?.hits, 3);
});

test('three votes in a row for one corner is a combo', () => {
  let state = tickDirector(emptyDirector(), 0, 0).state;
  const kinds: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const next = tickDirector(state, i, 0);
    state = next.state;
    kinds.push(next.event!.kind);
  }
  assert.deepEqual(kinds, ['jab', 'cross', 'combo']);
});

test('a vote for the other corner breaks the streak', () => {
  let state = tickDirector(emptyDirector(), 0, 0).state;
  state = tickDirector(state, 1, 0).state;
  state = tickDirector(state, 2, 0).state;
  state = tickDirector(state, 2, 1).state;
  const next = tickDirector(state, 3, 1);
  assert.notEqual(next.event?.kind, 'combo');
  assert.equal(next.state.streakA, 1);
});

test('longer streaks earn bigger combos', () => {
  let state = tickDirector(emptyDirector(), 0, 0).state;
  const hits: number[] = [];
  for (let i = 1; i <= 9; i++) {
    const next = tickDirector({ ...state, heatA: 0 }, i, 0);
    state = next.state;
    if (next.event?.kind === 'combo') hits.push(next.event.hits!);
  }
  assert.deepEqual(hits, [3, 4, 5]);
});

test('filling HEAT turns the next punch into a flurry and dumps the meter', () => {
  let state = emptyDirector();
  let votes = 0;
  while (state.heatA < HEAT_MAX) {
    votes += 1;
    state = tickDirector(state, votes, 0).state;
  }
  assert.equal(state.heatA, HEAT_MAX);
  const next = tickDirector(state, votes + 1, 0);
  assert.equal(next.event?.kind, 'flurry');
  assert.equal(next.state.heatA, 0);
});

test('kindForBurst maps burst size independently of heat', () => {
  assert.equal(kindForBurst(1, 0), 'jab');
  assert.equal(kindForBurst(2, 0), 'hook');
  assert.equal(kindForBurst(4, 0), 'uppercut');
  assert.equal(kindForBurst(10, 0), 'flurry');
  assert.equal(kindForBurst(1, HEAT_MAX), 'flurry');
});

test('a knockout puts the loser on the canvas', () => {
  const poses = posesFor(null, 'a', true);
  assert.equal(poses.a, 'won');
  assert.equal(poses.b, 'down');
});

test('a decision leaves the loser standing', () => {
  const poses = posesFor(null, 'b', false);
  assert.equal(poses.b, 'won');
  assert.equal(poses.a, 'lost');
});

test('when both sides gain, the bigger burst throws the punch', () => {
  const start = tickDirector(emptyDirector(), 4, 4).state;
  const { event } = tickDirector(start, 5, 10);
  assert.equal(event?.side, 'b');
});

test('back-to-back single votes walk through a combination', () => {
  let state = tickDirector(emptyDirector(), 0, 0).state;
  const kinds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const next = tickDirector({ ...state, streakA: 0 }, i, 0);
    state = next.state;
    kinds.push(next.event!.kind);
  }
  assert.deepEqual(kinds, ['jab', 'cross', 'jab', 'hook', 'body']);
});

test('a quiet chat makes one vote a full combo', () => {
  const { event, state } = tickDirector(emptyDirector(), 1, 0, 1000);
  assert.equal(event?.kind, 'combo');
  assert.equal(event?.side, 'a');
  assert.equal(event?.run, 1);
  assert.equal(event?.boost, 3);
  assert.equal(state.boost, 3);
});

test('votes count less as chat gets busier', () => {
  assert.equal(voteBoost(1), 3);
  assert.equal(voteBoost(5), 3);
  assert.equal(voteBoost(6), 2);
  assert.equal(voteBoost(12), 2);
  assert.equal(voteBoost(13), 1);
  assert.equal(voteBoost(80), 1);
});

test('a busy chat throws ordinary punches for single votes', () => {
  let state = emptyDirector();
  let now = 0;
  // Twenty votes split evenly over a few seconds.
  for (let i = 1; i <= 10; i++) {
    now += 300;
    state = tickDirector(state, i, i, now).state;
  }
  assert.equal(state.boost, 1);
  const { event } = tickDirector(state, 11, 10, now + 300);
  assert.notEqual(event?.kind, 'combo');
  assert.equal(event?.boost, 1);
});

test('old votes age out of the window and the boost comes back', () => {
  let state = emptyDirector();
  for (let i = 1; i <= 10; i++) state = tickDirector(state, i, i, i * 300).state;
  assert.equal(state.boost, 1);
  const later = 10 * 300 + CHAT_WINDOW_MS + 1;
  const { event } = tickDirector(state, 10, 11, later);
  assert.equal(event?.boost, 3);
  assert.equal(event?.kind, 'combo');
  assert.equal(event?.side, 'b');
});

test('without a clock every vote is worth one', () => {
  const { event } = tickDirector(emptyDirector(), 1, 0);
  assert.equal(event?.kind, 'jab');
});
