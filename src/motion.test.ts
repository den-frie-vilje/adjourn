import assert from 'node:assert/strict';
import { test } from 'node:test';
import { castBallot, newMotion, tally } from './motion.ts';

test('a participant votes once', () => {
  const motion = newMotion();
  assert.equal(castBallot(motion, 'a'), true);
  assert.equal(castBallot(motion, 'a'), false);
  assert.equal(motion.ballots.size, 1);
  assert.ok(![...motion.ballots].includes('a'), 'the identity is not stored');
});

test('the motion carries at the threshold, counting only those present', () => {
  const motion = newMotion(50);
  for (const id of ['a', 'b', 'c']) castBallot(motion, id);
  assert.deepEqual(tally(motion, ['a', 'b', 'c', 'd', 'e', 'f']), { votes: 3, present: 6, needed: 3, carried: true });
  assert.deepEqual(tally(motion, ['a', 'b', 'd', 'e', 'f', 'g', 'h']), { votes: 2, present: 7, needed: 4, carried: false });
  assert.equal(tally(motion, []).carried, false);
});

test('a stricter threshold rounds up', () => {
  const motion = newMotion(67);
  castBallot(motion, 'a');
  castBallot(motion, 'b');
  assert.deepEqual(tally(motion, ['a', 'b', 'c']), { votes: 2, present: 3, needed: 3, carried: false });
});
