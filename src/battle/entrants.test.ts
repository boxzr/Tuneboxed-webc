import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bracketEntrants,
  classicReady,
  hostJudges,
  ownerId,
  people,
  songsOf,
  songsPerPlayer,
  withOwnerNames,
} from './entrants.ts';
import { clockLabel, embedSourceOf, embedStart } from './embeds.ts';
import type { BattlePlayer, BattleRoom, BattleSubmission } from '../types/battle';

const row = (id: string, name: string, song: string | null, owner: string | null = null): BattlePlayer =>
  ({
    id,
    room_id: 'r',
    display_name: name,
    avatar_seed: null,
    is_guest: true,
    is_connected: owner === null,
    last_seen_at: '',
    joined_at: '',
    entry_song_title: song,
    owner_player_id: owner,
  }) as BattlePlayer;

const room = (patch: Partial<BattleRoom> = {}): BattleRoom =>
  ({
    id: 'r',
    format: 'bracket',
    play_style: 'classic',
    theme: '90s Hip Hop',
    min_players: 2,
    host_player_id: 'host',
    songs_per_player: 2,
    host_judges: false,
    ...patch,
  }) as BattleRoom;

const rows = [
  row('host', 'Host', 'H1'),
  row('ava', 'Ava', 'A1'),
  row('ava2', 'Ava #2', 'A2', 'ava'),
  row('ben', 'Ben', null),
];

test('an extra song is not a person', () => {
  assert.deepEqual(people(rows).map((p) => p.id), ['host', 'ava', 'ben']);
});

test('an extra song carries its owner name, not the "#2" label', () => {
  const named = withOwnerNames(rows);
  assert.equal(named.find((p) => p.id === 'ava2')?.display_name, 'Ava');
  assert.equal(ownerId(rows[2]), 'ava');
});

test("a player's songs are theirs, own row first", () => {
  assert.deepEqual(songsOf(rows, 'ava').map((p) => p.entry_song_title), ['A1', 'A2']);
  assert.deepEqual(songsOf(rows, 'ben'), []);
});

test('a judging host brings no songs to the bracket', () => {
  assert.equal(bracketEntrants(room(), rows).length, 4);
  const judged = bracketEntrants(room({ host_judges: true }), rows);
  assert.ok(!judged.some((p) => ownerId(p) === 'host'));
});

test('ready counts songs, and the judging host does not count toward it', () => {
  const two = [row('host', 'Host', 'H1'), row('ava', 'Ava', 'A1')];
  assert.equal(classicReady(room(), two), true);
  assert.equal(classicReady(room({ host_judges: true }), two), false);
  assert.equal(classicReady(room({ host_judges: true }), rows), true);
});

test('only brackets take several songs, and never more than five', () => {
  assert.equal(songsPerPlayer(room({ songs_per_player: 3 })), 3);
  assert.equal(songsPerPlayer(room({ format: 'rounds', songs_per_player: 3 })), 1);
  assert.equal(songsPerPlayer(room({ songs_per_player: 9 })), 5);
  assert.equal(songsPerPlayer(room({ songs_per_player: null })), 1);
});

test('host judging is a bracket setting', () => {
  assert.equal(hostJudges(room({ host_judges: true })), true);
  assert.equal(hostJudges(room({ host_judges: true, format: 'rounds' })), false);
});

const sub = (patch: Partial<BattleSubmission>): BattleSubmission =>
  ({ id: 's', external_id: 'abc', source: 'youtube', start_seconds: 0, ...patch }) as BattleSubmission;

test('only YouTube and SoundCloud picks get a player and a start point', () => {
  assert.equal(embedSourceOf(sub({})), 'youtube');
  assert.equal(embedSourceOf(sub({ source: 'soundcloud' })), 'soundcloud');
  assert.equal(embedSourceOf(sub({ source: 'itunes' })), null);
  assert.equal(embedSourceOf(sub({ external_id: null })), null);
});

test('a start point is whole seconds from the top, never negative', () => {
  assert.equal(embedStart(sub({ start_seconds: 75 })), 75);
  assert.equal(embedStart(sub({ start_seconds: null })), 0);
  assert.equal(embedStart(sub({ start_seconds: -4 })), 0);
  assert.equal(clockLabel(75), '1:15');
  assert.equal(clockLabel(5), '0:05');
});
