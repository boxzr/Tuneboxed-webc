import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHIN, THIGH, ankleOf, solveLeg } from './legIK.ts';

const hip = [0.12, 0.4, 0] as const;
const near = (a: readonly number[], b: readonly number[], eps = 1e-6) =>
  a.every((v, i) => Math.abs(v - b[i]) < eps);

test('a leg hanging straight down has no bend', () => {
  const a = solveLeg(hip, [0.12, 0.4 - THIGH - SHIN, 0]);
  assert.ok(Math.abs(a.splay) < 1e-6);
  assert.ok(a.knee < 0.05);
});

test('crouching over a planted foot bends the knee forward', () => {
  const ankle = [0.12, 0.4 - 0.26, 0] as const;
  const a = solveLeg(hip, ankle);
  assert.ok(a.knee > 0.6);
  assert.ok(a.pitch < 0, 'knee should come forward');
  assert.ok(near(ankleOf(hip, a), ankle));
});

test('the solve lands the ankle where it was asked, wide and forward too', () => {
  for (const ankle of [
    [0.24, 0.12, 0.08],
    [0.05, 0.16, -0.06],
    [0.2, 0.22, 0.18],
  ] as const) {
    assert.ok(near(ankleOf(hip, solveLeg(hip, ankle)), ankle), `missed ${ankle}`);
  }
});

test('an ankle out of reach straightens the leg toward it', () => {
  const a = solveLeg(hip, [0.12, -0.2, 0]);
  assert.equal(a.reached, false);
  assert.ok(a.knee < 0.05);
});
