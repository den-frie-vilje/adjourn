import { App } from '@microsoft/teams.apps';
import { MessageActivityInput, type TeamsChannelAccount } from '@microsoft/teams.api';
import type { Client as ApiClient } from '@microsoft/teams.api';
import { motionCard, thresholds } from './card.ts';
import { castBallot, newMotion, tally, type Motion } from './motion.ts';

/** Where the organiser's dialog lives; its domain is in the manifest's validDomains. */
const motionPage = process.env.MOTION_PAGE_URL ?? 'https://den-frie-vilje.github.io/adjourn/motion/';

// shortcut: motions live in memory, one bot instance; move to app storage when running more than one.
const motions = new Map<string, Motion>();

const app = new App();

type Ctx = { api: ApiClient; activity: { conversation: { id: string }; channelData?: { meeting?: { id?: string }; tenant?: { id?: string } } } };

function meetingOf({ activity }: Ctx) {
  const meetingId = activity.channelData?.meeting?.id;
  const tenantId = activity.channelData?.tenant?.id;
  return meetingId && tenantId ? { meetingId, tenantId, conversationId: activity.conversation.id } : undefined;
}

/** Participants currently in the meeting: their AAD object ids, by asking the roster one by one. */
async function presentIds(api: ApiClient, conversationId: string, meetingId: string, tenantId: string): Promise<string[]> {
  const members: TeamsChannelAccount[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await api.conversations.members(conversationId).getPaged(500, continuationToken);
    members.push(...page.members);
    continuationToken = page.continuationToken;
  } while (continuationToken);
  const present = await Promise.all(
    members.map(async (m) => {
      if (!m.aadObjectId) return undefined;
      const p = await api.meetings.getParticipant(meetingId, m.aadObjectId, tenantId).catch(() => undefined);
      return p?.meeting?.inMeeting ? m.aadObjectId : undefined;
    }),
  );
  return present.filter((id): id is string => id !== undefined);
}

async function showCard(api: ApiClient, conversationId: string, motion: Motion, present: string[]) {
  const card = motionCard(motion.threshold, tally(motion, present));
  const message = new MessageActivityInput().addCard('adaptive', card);
  if (motion.messageId) message.withId(motion.messageId);
  const sent = await app.send(conversationId, message);
  motion.messageId = sent.id;
}

async function openMotion(ctx: Ctx) {
  const meeting = meetingOf(ctx);
  if (!meeting) return;
  const motion = newMotion();
  motions.set(meeting.conversationId, motion);
  await showCard(ctx.api, meeting.conversationId, motion, await presentIds(ctx.api, meeting.conversationId, meeting.meetingId, meeting.tenantId));
}

app.on('install.add', openMotion);
app.on('meetingStart', openMotion);
app.on('meetingEnd', ({ activity }) => {
  motions.delete(activity.conversation.id);
});

const privately = (value: string) => ({ statusCode: 200 as const, type: 'application/vnd.microsoft.activity.message' as const, value });

app.on('card.action.vote', async (ctx) => {
  const meeting = meetingOf(ctx);
  const motion = meeting && motions.get(meeting.conversationId);
  if (!meeting || !motion || motion.carried) return privately('This motion is closed.');
  const voter = ctx.activity.from.aadObjectId ?? ctx.activity.from.id;
  if (!castBallot(motion, voter)) return privately('You have already voted.');
  const present = await presentIds(ctx.api, meeting.conversationId, meeting.meetingId, meeting.tenantId);
  const t = tally(motion, present);
  if (t.carried) {
    motion.carried = true;
    const info = await ctx.api.meetings.getById(meeting.meetingId);
    // Learn's notification API wants the organiser's 29: user id, not the Entra object id.
    if (info.organizer?.id) {
      const url = `${motionPage}?votes=${t.votes}&present=${t.present}`;
      await ctx.api.meetings.sendNotification(meeting.meetingId, {
        value: {
          recipients: [info.organizer.id],
          surfaces: [{ surface: 'meetingStage', contentType: 'task', content: { value: { height: '320', width: '480', title: 'Motion to adjourn', url } } }],
        },
      });
    }
  }
  await showCard(ctx.api, meeting.conversationId, motion, present);
  return privately(t.carried ? 'Your vote carried the motion.' : 'Your vote is counted.');
});

app.on('card.action.threshold', async (ctx) => {
  const meeting = meetingOf(ctx);
  const motion = meeting && motions.get(meeting.conversationId);
  if (!meeting || !motion || motion.carried) return privately('This motion is closed.');
  const me = ctx.activity.from.aadObjectId;
  const role = me && (await ctx.api.meetings.getParticipant(meeting.meetingId, me, meeting.tenantId)).meeting?.role;
  if (role !== 'Organizer') return privately('Only the organiser sets the threshold.');
  const chosen = Number(ctx.activity.value.action.data?.threshold);
  if (!thresholds.includes(chosen)) return privately('Pick one of the listed thresholds.');
  motion.threshold = chosen;
  await showCard(ctx.api, meeting.conversationId, motion, await presentIds(ctx.api, meeting.conversationId, meeting.meetingId, meeting.tenantId));
  return privately(`The motion now carries at ${chosen}%.`);
});

await app.start();
