import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANKLE, BEAT, DANCES, HIP, danceFor, danceFrame, encoreFor, type DanceFrame, type Vec3 } from './dances.ts';
import { SHIN, THIGH } from './legIK.ts';
import { walkPlan } from './walkStyles.ts';

const SHOULDER = { l: [-0.19, 0.13, 0] as Vec3, r: [0.19, 0.13, 0] as Vec3 };
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const at = (d: Parameters<typeof danceFrame>[0], beats: number) => danceFrame(d, beats * BEAT);

/** Hip to ankle for one leg, in root space, the way the rig measures it. */
function legLength(f: DanceFrame, s: -1 | 1) {
  const ft = s > 0 ? f.footR : f.footL;
  const dx = s * (ANKLE.x + ft[0]) - (s * HIP.x + f.x);
  const dy = ANKLE.y + ft[1] - (HIP.y + f.y + s * HIP.x * Math.sin(f.roll));
  const dz = ft[2] - (s < 0 ? HIP.z : -HIP.z);
  return Math.hypot(dx, dy, dz);
}

test('every dance stays finite, in reach and on its feet for a whole minute', () => {
  for (const d of DANCES) {
    for (let t = 0; t < 60; t += 0.037) {
      const f = danceFrame(d, t);
      for (const v of Object.values(f).flat()) assert.ok(Number.isFinite(v), `${d} at ${t}`);
      assert.ok(dist(f.l, SHOULDER.l) < 0.75, `${d} left hand flies off at ${t}`);
      assert.ok(dist(f.r, SHOULDER.r) < 0.75, `${d} right hand flies off at ${t}`);
      assert.ok(f.footL[1] >= 0 && f.footR[1] >= 0, `${d} puts a foot through the floor at ${t}`);
      assert.ok(f.y > -0.2, `${d} squats too deep at ${t}`);
      if (f.y <= 0) {
        for (const s of [-1, 1] as const) {
          const planted = (s > 0 ? f.footR : f.footL)[1] < 0.001;
          if (planted) assert.ok(legLength(f, s) <= THIGH + SHIN + 1e-6, `${d} lifts a planted foot at ${t}`);
        }
      }
    }
  }
});

test('hit dem folks crosses an arm, then hits a flex with a knee up', () => {
  const cross = at('folks', 0.8);
  assert.ok(cross.r[0] < 0, 'right arm crosses the chest on 1');
  assert.ok(cross.footL[0] > 0.04, 'left foot steps out with it');
  assert.ok(at('folks', 2.8).l[0] > 0, 'then the left arm crosses');
  const hit = at('folks', 7.6);
  assert.ok(hit.l[1] > 0.35 && hit.r[1] > 0.35 && hit.r[0] > 0.35 && hit.l[0] < -0.35, 'arms flexed up and out');
  assert.ok(Math.max(hit.footL[1], hit.footR[1]) > 0.14, 'a knee comes up');
  assert.ok(hit.pitch > 0.25, 'chest crunches forward');
  const next = at('folks', 15.6);
  assert.ok((hit.footL[1] > hit.footR[1]) !== (next.footL[1] > next.footR[1]), 'the knee swaps each eight');
});

test('the whip squats wide and whips a fist up in front of the chin', () => {
  const f = at('whip', 1.5);
  assert.ok(f.y < -0.08, 'deep squat');
  assert.ok(f.footL[0] > 0.08 && f.footR[0] > 0.08, 'wide stance');
  assert.ok(f.r[2] > 0.35 && f.r[1] > 0.15 && Math.abs(f.r[0]) < 0.15, 'fist in front of the chin');
  assert.ok(at('whip', 0).r[0] > 0.3, 'the whip starts out at the side');
});

test('the shoot raises the knee, hops, then kicks out with a fist pump', () => {
  const gather = at('shoot', 0.34);
  assert.ok(gather.footR[1] > 0.14 && gather.footR[2] < 0.12, 'knee up at 90 degrees');
  assert.ok(gather.r[1] > 0.25, 'fist cocked');
  assert.ok(at('shoot', 0.42).y > 0, 'hops off the standing foot');
  const kick = at('shoot', 0.7);
  assert.ok(kick.footR[2] > 0.24, 'leg extends forward');
  assert.ok(kick.r[2] > 0.38, 'fist pumps forward');
  assert.ok(Math.abs(kick.turn) > 0.5, 'body turned to the side');
});

test('the dougie steps single, single, double and brushes past the ear', () => {
  const steps = [0.4, 1.4, 2.2, 2.7].map((b) => at('dougie', b));
  assert.ok(steps[0].footR[0] > 0.04 && steps[1].footL[0] > 0.04, 'right, then left');
  assert.ok(steps[2].footR[0] > 0.04 && steps[3].footR[0] > 0.04, 'then right twice');
  assert.ok(steps[0].tilt > 0.05 && steps[1].tilt < -0.05, 'hips sway with the step');
  assert.ok(at('dougie', 0.55).r[1] > 0.45, 'hand brushes up by the head');
  assert.ok(at('dougie', 4.4).footL[0] > 0.04, 'the next phrase leads with the other foot');
});

test('stanky leg circles one knee in, then the other', () => {
  const knee = (from: number, key: 'kneeL' | 'kneeR') =>
    Math.max(...Array.from({ length: 20 }, (_, i) => at('stanky', from + i * 0.1)[key]));
  assert.ok(knee(0, 'kneeR') > 0.6 && knee(0, 'kneeL') < 0.1);
  assert.ok(knee(4, 'kneeL') > 0.6 && knee(4, 'kneeR') < 0.1);
  assert.ok(at('stanky', 0.5).footR[0] > 0.1, 'the stanky leg is out to the side');
});

test('the sprinkler keeps a hand behind the head and turns in three pulls', () => {
  const f = at('sprinkler', 0.5);
  assert.ok(f.r[2] < -0.2 && f.r[1] > 0.4, 'hand behind the head');
  assert.ok(f.l[0] < -0.5, 'other arm straight out');
  const turns = [0.6, 1.6, 2.6].map((b) => at('sprinkler', b).turn);
  assert.ok(turns[0] > turns[1] + 0.3 && turns[1] > turns[2] + 0.3, 'three distinct pulls');
  assert.ok(at('sprinkler', 3.95).turn > 0.6, 'then sweeps back');
});

test('shmoney flips the hip with the arms open wide', () => {
  const a = at('shmoney', 0.35);
  const b = at('shmoney', 1.35);
  assert.ok(Math.sign(a.x) !== Math.sign(b.x), 'hip goes side to side');
  assert.ok(a.r[0] > 0.35 && a.l[0] < -0.35, 'arms open like a hug');
});

test('the dab buries the face in the elbow', () => {
  const f = at('dab', 2.8);
  assert.ok(f.nod > 0.4);
  assert.ok(f.r[1] > 0.4 && f.l[1] > 0.4, 'both arms up on the dab');
});

test('the milly rock travels out and back with a swipe across the chest', () => {
  assert.ok(at('milly', 1.9).x > 0.08, 'stepped across to the right');
  assert.ok(Math.abs(at('milly', 3.99).x) < 0.01, 'and back');
  const swipe = at('milly', 1.7);
  assert.ok(swipe.r[0] < 0.05, 'right arm swipes across to the other shoulder');
});

test('the nae nae waves one hand high over a deep stance', () => {
  const f = at('naenae', 1.5);
  assert.ok(f.r[1] > 0.55 && f.l[1] < 0, 'one up, one hanging');
  assert.ok(f.y < -0.07);
});

test('the griddy taps alternate heels out in front, toes up', () => {
  const left = at('griddy', 0.25);
  const right = at('griddy', 0.75);
  assert.ok(left.footR[2] > 0.12 && left.toeR > 0.4);
  assert.ok(right.footL[2] > 0.12 && right.toeL > 0.4);
});

test('a fighter keeps the same dance and the encore is always a different one', () => {
  assert.equal(danceFor('ashley'), danceFor('ashley'));
  for (let i = 0; i < 200; i++) {
    const main = danceFor(`fighter-${i}`);
    assert.notEqual(encoreFor(main, `fight-${i}`), main);
  }
  assert.equal(new Set(Array.from({ length: 200 }, (_, i) => danceFor(`n${i}`))).size, DANCES.length);
});

test('the walkout dances on stage, mid-aisle and at the apron, and only moves forward', () => {
  let last = -1;
  const moves: string[] = [];
  for (let p = 0; p <= 1; p += 0.005) {
    const beat = walkPlan(p);
    assert.ok(beat.along >= last - 1e-9, `walks backwards at ${p}`);
    last = beat.along;
    const label = `${beat.move}:${beat.dance}`;
    if (moves[moves.length - 1] !== label) moves.push(label);
  }
  assert.deepEqual(moves, ['dance:main', 'walk:main', 'dance:encore', 'walk:main', 'dance:main']);
  assert.equal(walkPlan(0).along, 0);
  assert.equal(walkPlan(1).along, 1);
});
