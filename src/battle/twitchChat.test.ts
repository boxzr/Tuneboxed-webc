import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrivmsg, parseVote } from './twitchChat.ts';

test('reads the sender and body out of a chat line', () => {
  const msg = parsePrivmsg(':ash!ash@ash.tmi.twitch.tv PRIVMSG #streamer :1');
  assert.deepEqual(msg, { user: 'ash', text: '1' });
});

test('handles a line that arrives with tags', () => {
  const msg = parsePrivmsg(
    '@badge-info=;color=#FF0000 :ash!ash@ash.tmi.twitch.tv PRIVMSG #streamer :2'
  );
  assert.deepEqual(msg, { user: 'ash', text: '2' });
});

test('lowercases the sender so casing cannot split one voter in two', () => {
  const msg = parsePrivmsg(':AshLey!x@x.tmi.twitch.tv PRIVMSG #s :1');
  assert.equal(msg?.user, 'ashley');
});

test('keeps colons inside the message body', () => {
  const msg = parsePrivmsg(':ash!x@x.tmi.twitch.tv PRIVMSG #s :wow: that was good');
  assert.equal(msg?.text, 'wow: that was good');
});

test('ignores the membership traffic around real messages', () => {
  for (const line of [
    ':tmi.twitch.tv 001 justinfan1 :Welcome, GLHF!',
    ':justinfan1.tmi.twitch.tv 353 justinfan1 = #s :justinfan1',
    ':ash!x@x.tmi.twitch.tv JOIN #s',
    'PING :tmi.twitch.tv',
  ]) {
    assert.equal(parsePrivmsg(line), null, line);
  }
});

test('counts a bare number as a vote', () => {
  assert.equal(parseVote('1', 2), 1);
  assert.equal(parseVote('2', 2), 2);
  assert.equal(parseVote('  2  ', 2), 2);
});

test('ignores a number that is part of a sentence', () => {
  // The whole reason for matching strictly: ordinary chat during a battle is
  // full of digits, and counting these would quietly corrupt the result.
  assert.equal(parseVote('that was 1 of the best', 2), null);
  assert.equal(parseVote('1st one', 2), null);
  assert.equal(parseVote('song 2 lol', 2), null);
});

test('ignores a number outside the range of options', () => {
  assert.equal(parseVote('0', 2), null);
  assert.equal(parseVote('3', 2), null);
  assert.equal(parseVote('99', 2), null);
});

test('ignores non-numeric chatter', () => {
  for (const text of ['', 'one', 'PogChamp', '!vote 1', '1.5', '-1']) {
    assert.equal(parseVote(text, 2), null, text);
  }
});
