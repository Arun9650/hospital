-- ===========================================================================
-- Aria Health — let push_subscriptions also hold native (Expo) push tokens.
-- Run AFTER 0005_push.sql. Safe to re-run.
--
-- push_subscriptions was Web Push (VAPID) only: endpoint + p256dh + auth. An
-- Expo push token is a single opaque string with no key pair, so we store it in
-- `endpoint` (still the unique per-device id) and leave the key columns null.
-- That keeps ONE device table for both transports:
--   • Web rows  → p256dh/auth present  → delivered by lib/push/send.ts (web-push)
--   • Expo rows → p256dh/auth null      → delivered by the push-fanout function
-- `p256dh is null` is the discriminator; each sender filters to its own rows.
-- ===========================================================================

alter table public.push_subscriptions alter column p256dh drop not null;
alter table public.push_subscriptions alter column auth   drop not null;
