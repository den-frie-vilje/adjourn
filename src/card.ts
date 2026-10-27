import { ActionSet, AdaptiveCard, Choice, ChoiceSetInput, ExecuteAction, TextBlock } from '@microsoft/teams.cards';
import type { Tally } from './motion.ts';

export const thresholds = [50, 67, 75, 100];

/** The one card Adjourn posts in the meeting chat. Counts only; never who. */
export function motionCard(threshold: number, t: Tally): AdaptiveCard {
  const status = t.carried
    ? 'The motion carried. The organiser has been asked to end the meeting.'
    : t.present === 0
      ? `Votes are counted against who is in the meeting. The motion carries at ${threshold}%.`
      : `${t.votes} of ${t.present} present have voted to end the meeting. It takes ${t.needed}.`;
  const card = new AdaptiveCard(
    new TextBlock('Motion to adjourn', { size: 'Large', weight: 'Bolder' }),
    new TextBlock(status, { wrap: true }),
    new TextBlock('Anonymous. One vote each.', { isSubtle: true, size: 'Small', spacing: 'None' }),
  );
  if (!t.carried) {
    card.body.push(
      new ActionSet(new ExecuteAction({ title: 'Vote to end the meeting' }).withData({ action: 'vote' })),
      new ChoiceSetInput(...thresholds.map((p) => new Choice({ title: `${p}% of those present`, value: String(p) }))).withId('threshold').withValue(String(threshold)),
      new ActionSet(new ExecuteAction({ title: 'Set threshold (organiser)' }).withData({ action: 'threshold' }).withAssociatedInputs('auto')),
    );
  }
  return card;
}
