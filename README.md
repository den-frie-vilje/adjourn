<p align="center">
  <img alt="Four colleagues in a video meeting, every one of them rolling their eyes at the ceiling, under the name Adjourn" src="docs/img/readme-hero.jpg" width="880">
</p>

<h1 align="center">Adjourn</h1>

<p align="center">Ends the meeting when enough of the room has voted to.</p>

<h3 align="center">
  <a href="#install-adjourn">Installation</a> ·
  <a href="https://den-frie-vilje.github.io/adjourn/">Product page</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#limits">Limits</a>
</h3>

<br>

Adjourn is a Microsoft Teams app for meetings. It posts one card in the meeting chat. Anyone in the meeting can press its button to vote to end the meeting, anonymously and once. When the share of those present reaches the threshold, the organiser gets a private notification on the meeting stage asking them to end it.

Teams gives no app a way to end a meeting for everyone, so the organiser presses the button. Adjourn supplies the numbers.

## What you get

| | |
|---|---|
| **One card** | Posted when Adjourn is added to the meeting chat, and again when a scheduled meeting starts. It shows the count and the button, never names. |
| **One vote each** | A second press is answered privately with "You have already voted". Votes cannot be withdrawn. |
| **Counted against those present** | Votes are measured against the people in the meeting at that moment, not the invitation list. |
| **A threshold** | 50 percent by default. The organiser can set 50, 67, 75 or 100 from the card. |
| **A private ask** | At the threshold the organiser gets a targeted notification on the meeting stage with the count and the two clicks that end the meeting. |

## What you need

- A Microsoft 365 tenant where custom app upload is allowed, or a Teams admin who will publish Adjourn to the organisation's catalogue.
- Somewhere to run one Node.js process (22 or later) behind HTTPS. For trying it out, a dev tunnel from your own machine.
- A bot registration, which gives Adjourn its app id and secret. Teams-managed registrations need no Azure subscription.

## Install Adjourn

1. Clone and install:

   ```sh
   git clone https://github.com/den-frie-vilje/adjourn
   cd adjourn && pnpm install
   ```

2. Open a tunnel to port 3978 and note its hostname. With Microsoft's dev tunnels:

   ```sh
   devtunnel user login
   devtunnel create --allow-anonymous
   devtunnel port create -p 3978
   devtunnel host
   ```

3. Register the bot. Either in the [Teams Developer Portal](https://dev.teams.microsoft.com) under Tools › Bot management › New bot, with the messaging endpoint `https://<your-host>/api/messages`, and create a client secret; or with the Teams CLI (`npm install -g @microsoft/teams.cli`, `teams login`, then `teams app create --endpoint https://<your-host>/api/messages --name Adjourn --env .env`).

4. Put the ids in `.env` in the repository root:

   ```sh
   CLIENT_ID=<the bot's app id>
   CLIENT_SECRET=<the client secret>
   TENANT_ID=<your tenant id>
   BOT_DOMAIN=<your-host, no scheme>
   ```

5. Start the bot and build the app package:

   ```sh
   pnpm dev
   pnpm package
   ```

6. In Teams, open the meeting's chat or the meeting itself, select **Apps**, then **Manage your apps** › **Upload an app** › **Upload a custom app**, and choose `appPackage/adjourn.zip`. The organiser or a presenter consents to the permissions once. Adjourn posts its card.

Change the code and the running bot picks it up; change the manifest and upload the package again.

## How it works

The whole app is `src/app.ts`, `src/card.ts` and `src/motion.ts`, on the [Teams SDK](https://microsoft.github.io/teams-sdk/) for TypeScript.

- When Adjourn is added to a meeting chat, or a scheduled meeting starts, it opens a motion and posts the card.
- A press on the card arrives as an `adaptiveCard/action` invoke. Teams authenticates the sender; nothing is posted to the chat. Adjourn stores a salted hash of the sender's id in the motion, declines a second press, and answers privately.
- To count those present, Adjourn lists the chat's members and asks the meeting participant API whether each is in the meeting. The card is then updated in place with "n of m present have voted. It takes k."
- When votes reach `ceil(present × threshold / 100)`, Adjourn fetches the meeting's organiser and sends a targeted in-meeting notification that opens `docs/motion/index.html` from this repository's GitHub Pages site, with the count in the URL. The card closes.
- When the meeting ends, the motion is forgotten.

Motions live in memory. Restarting the bot forgets open motions; the next meeting start opens a fresh one.

## Limits

- Teams has no API that ends a meeting for everyone. Adjourn asks the organiser. Removing participants one by one is possible for a calling bot with a tenant administrator's allow-listing; Adjourn does not do that.
- The participant API answers for rosters below 350 members and for people signed in to the tenant. Anonymous guests are neither counted as present nor able to vote.
- Meeting start and end events fire for scheduled and channel meetings. For an ad-hoc meeting, add Adjourn from the meeting chat and the card appears on installation.
- The organiser's notification is a dialog that loads a page; the page's domain must be in the manifest's `validDomains`. The shipped manifest lists `den-frie-vilje.github.io`. Change `MOTION_PAGE_URL` and the manifest together if you host the page elsewhere.
- The Teams Store's naming rules want a common noun prefixed with the publisher's name. The manifest's full name is "Adjourn by Den Frie Vilje" for that reason; the short name stays Adjourn.

## Privacy

Adjourn keeps, for the length of a meeting and in the memory of one process: the threshold, a salted hash per voter, and the id of its own card message. It never stores or shows who voted. It reads the meeting's basic details, who is in it and the chat's members, sends messages to the chat and one notification to the organiser, and nothing else. No database, no telemetry, no account.

## Development

```sh
pnpm typecheck
pnpm test
pnpm build
```

The product page is `docs/index.html`, served by GitHub Pages; `scripts/og.sh` renders its social image and this README's hero from `docs/og.html` and `docs/readme-hero.html`.

## Licence

MIT. Copyright Den Frie Vilje ApS.
