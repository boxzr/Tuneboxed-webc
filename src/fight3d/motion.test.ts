import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hitReaction,
  punchDuration,
  punchOut,
  punchPhaseAt,
  punchPhases,
  stepIn,
  weightOf,
} from './motion.ts';

test('a jab winds up before the snap, so the glove loads back first', () => {
  const early = punchOut(0.02, 'jab');
  const mid = punchOut(punchPhases('jab').wind + punchPhases('jab').snap * 0.5, 'jab');
  assert.ok(early < 0);
  assert.ok(mid > 0);
});

test('a hook is fully extended in the hold', () => {
  const p = punchPhases('hook');
  const at = p.wind + p.snap + p.hold * 0.5;
  assert.ok(Math.abs(punchOut(at, 'hook') - 1) < 0.02);
});

test('a punch is back on guard after the recover', () => {
  assert.equal(punchOut(punchDuration('jab') + 0.05, 'jab'), 0);
});

test('a flurry oscillates instead of a single snap', () => {
  const a = punchOut(0.1, 'flurry');
  const b = punchOut(0.1 + Math.PI / 32, 'flurry');
  assert.notEqual(Math.round(a * 100), Math.round(b * 100));
});

test('heavy boxers lunge more and fly less', () => {
  const h = weightOf('heavy');
  const l = weightOf('light');
  assert.ok(h.lunge > l.lunge);
  assert.ok(h.knock < l.knock);
  assert.ok(h.speed < l.speed);
});

test('the snap phase sits between wind-up and the held pose', () => {
  const p = punchPhases('jab');
  assert.equal(punchPhaseAt(p.wind * 0.4, 'jab'), 'wind');
  assert.equal(punchPhaseAt(p.wind + p.snap * 0.5, 'jab'), 'snap');
  assert.equal(punchPhaseAt(p.wind + p.snap + p.hold * 0.5, 'jab'), 'hold');
});

test('footwork gathers on the wind-up and closes range on the snap', () => {
  const p = punchPhases('hook');
  assert.ok(stepIn(p.wind * 0.5, 'hook') < 0);
  assert.ok(stepIn(p.wind + p.snap, 'hook') > 0.2);
});

test('an uppercut lifts; a hook twists; a flurry covers up', () => {
  assert.ok(hitReaction('uppercut').lift > hitReaction('jab').lift);
  assert.ok(hitReaction('hook').twist > hitReaction('jab').twist);
  assert.equal(hitReaction('flurry').cover, 1);
  assert.equal(hitReaction('jab').cover, 0);
});
