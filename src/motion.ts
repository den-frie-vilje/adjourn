import { createHash, randomBytes } from 'node:crypto';

/** One motion to adjourn: the running vote in one meeting chat. */
export type Motion = {
  /** Share of present participants that carries the motion, in percent. */
  threshold: number;
  /** Salted hashes of the participants who have voted. Never the identities themselves. */
  ballots: Set<string>;
  /** Per-motion salt, so a memory dump of the bot cannot be read back into names. */
  salt: string;
  /** Id of the card message in the chat, so it can be updated in place. */
  messageId?: string;
  /** Set once the organiser has been told; the motion carries only once. */
  carried?: boolean;
};

export const defaultThreshold = 50;

export function newMotion(threshold = defaultThreshold): Motion {
  return { threshold, ballots: new Set(), salt: randomBytes(16).toString('hex') };
}

function ballotOf(motion: Motion, participantId: string): string {
  return createHash('sha256').update(motion.salt).update(participantId).digest('hex');
}

/** Casts a ballot; false when this participant has already voted. */
export function castBallot(motion: Motion, participantId: string): boolean {
  const ballot = ballotOf(motion, participantId);
  if (motion.ballots.has(ballot)) return false;
  motion.ballots.add(ballot);
  return true;
}

export type Tally = { votes: number; present: number; needed: number; carried: boolean };

/** Counts only the ballots of participants who are still in the meeting. */
export function tally(motion: Motion, presentIds: string[]): Tally {
  const present = presentIds.length;
  const votes = presentIds.filter((id) => motion.ballots.has(ballotOf(motion, id))).length;
  const needed = Math.max(1, Math.ceil((present * motion.threshold) / 100));
  return { votes, present, needed, carried: present > 0 && votes >= needed };
}
