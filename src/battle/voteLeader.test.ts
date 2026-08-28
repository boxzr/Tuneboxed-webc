import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uniqueLeader } from './voteLeader.ts';

test('no votes means nobody is winning', () => {
  assert.equal(uniqueLeader({ a: 0, b: 0 }), null);
  assert.equal(uniqueLeader({}), null);
});

test('a clear lead wins', () => {
  assert.equal(uniqueLeader({ a: 3, b: 1 }), 'a');
  assert.equal(uniqueLeader({ a: 1, b: 4 }), 'b');
});

test('a tie is not a winner, even when people voted', () => {
  assert.equal(uniqueLeader({ a: 2, b: 2 }), null);
  assert.equal(uniqueLeader({ a: 5, b: 5 }), null);
});
