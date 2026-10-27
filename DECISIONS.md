# Decisions

Dated records of what was decided and why. Newest last.

## 2026-10-27: Ask the organiser rather than end the meeting

Microsoft Graph's cloud communications API, the TeamsJS client library and the Bot Framework meeting APIs were checked. None ends a meeting for everyone: `DELETE /communications/calls/{id}` hangs up the bot's own leg, deleting the `onlineMeeting` removes the object and not the live session, and Microsoft's own Q&A answer says ending is "currently not available". A calling bot can remove participants one at a time, with application permissions and a tenant administrator's PowerShell allow-list, and it is undocumented whether the organiser can be removed. Adjourn therefore sends the organiser a targeted in-meeting notification with the count. Removal stays a possible opt-in for tenants that allow-list it; it is not built.

## 2026-10-27: One card, no tab

A meeting side panel would need a web frontend and single sign-on to trust who is voting. An Adaptive Card with `Action.Execute` gets the authenticated sender from Teams on every press, posts nothing visible, and updates in place for everyone. The whole app is a bot.

## 2026-10-27: Anonymous and once

Voters are stored as SHA-256 hashes of their id with a per-motion random salt, in memory, for the length of the meeting. The card shows counts only. The reply to a press is the private invoke response. A second press is refused rather than toggled: a vote cannot be withdrawn.

## 2026-10-27: Count those present

The denominator is the people in the meeting at the moment of the vote, read from the meeting participant API's `inMeeting` flag for each chat member, not the invitation list. A voter who leaves stops counting.

## 2026-10-27: Manifest 1.19, Teams SDK 2.1

The manifest follows Microsoft's own meetings samples (schema 1.19), which carry the same RSC permissions. The code uses the Teams SDK for TypeScript, which Microsoft's platform pages now name as the SDK for Teams agents and bots; TeamsFx is deprecated.

## 2026-10-27: The product page parodies the Teams marketing page

Measured from microsoft.com's Teams page stylesheet rather than copied from a sibling product page. Microsoft's name and the Teams name appear only to say what Adjourn works with; no Microsoft logo, product image or UI is reproduced, and the page says so.
