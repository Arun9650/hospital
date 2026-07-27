---
version: alpha
name: Organic
description: |
  Organic is Sehat's mobile design system — a calm, natural, trust-first
  language for a health app you hold in your hand. Where a gaming brand shouts,
  Sehat breathes: a warm oat-paper canvas, a healing sage-green primary, one
  earthy clay accent, and soft diffuse shadows that make cards feel like smooth
  river pebbles resting on the page. Type pairs a soft humanist serif (Fraunces)
  for headings with a clean humanist sans (Inter) for everything functional, so
  the product reads like a wellness journal rather than a dashboard. Geometry is
  generous and rounded — 20px pebble cards, fully-rounded pill CTAs, circular
  avatars — and the layout is phone-portrait first: a bottom tab bar, bottom
  sheets for actions, and a single-column rhythm with roomy air. Nothing is
  clinical-cold; nothing is loud. The system's job is to lower the patient's
  pulse.

colors:
  primary: "#3E7A5E"
  primary-pressed: "#31624B"
  primary-soft: "#E7F0EA"
  on-primary: "#FFFFFF"
  accent: "#C97B5A"
  accent-pressed: "#AE6446"
  accent-soft: "#F6E6DD"
  on-accent: "#FFFFFF"
  canvas: "#FAF7F1"
  canvas-sunken: "#F1ECE1"
  surface: "#FFFFFF"
  surface-soft: "#FBF9F4"
  hairline: "#E8E2D5"
  ink: "#2A2C26"
  body: "#55584E"
  mute: "#8B8E83"
  ash: "#B8BAAF"
  on-primary-soft: "#2C5A43"
  canvas-night: "#1E211C"
  surface-night: "#272B24"
  hairline-night: "rgba(242,239,231,0.12)"
  on-night: "#F2EFE7"
  body-night: "rgba(242,239,231,0.72)"
  mute-night: "rgba(242,239,231,0.5)"
  success: "#3E7A5E"
  success-soft: "#E7F0EA"
  warning: "#C08A2E"
  warning-soft: "#F6ECD8"
  danger: "#B4483C"
  danger-soft: "#F6E0DC"
  info: "#5B7C99"
  info-soft: "#E4ECF2"
  focus-ring: "rgba(62,122,94,0.35)"

typography:
  display-xl:
    fontFamily: Fraunces
    fontSize: 34px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.4px
  display-lg:
    fontFamily: Fraunces
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.3px
  heading-lg:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.2px
  heading-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.1px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.1px
  overline:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.8px
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.1px
  tab-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.2px

rounded:
  none: 0px
  sm: 8px
  md: 14px
  lg: 20px
  xl: 28px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  huge: 40px
  screen-x: 20px

elevation:
  flat: "none"
  raised: "0 2px 8px rgba(42,44,38,0.06)"
  card: "0 6px 20px rgba(42,44,38,0.08)"
  sheet: "0 -8px 32px rgba(42,44,38,0.12)"
  float: "0 10px 28px rgba(49,98,75,0.22)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 16px 24px
    height: 54px
    elevation: "{elevation.raised}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.on-primary-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 16px 24px
    height: 54px
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 14px 20px
    border: "1px solid {colors.hairline}"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 16px 24px
    height: 54px
  button-disabled:
    backgroundColor: "{colors.canvas-sunken}"
    textColor: "{colors.ash}"
    rounded: "{rounded.full}"
  fab-consult:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.full}"
    padding: 16px 22px
    height: 56px
    elevation: "{elevation.float}"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    padding: 16px
    height: 54px
    border: "1px solid {colors.hairline}"
  text-input-focused:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    border: "2px solid {colors.primary}"
    ring: "0 0 0 4px {colors.focus-ring}"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 12px 18px
    height: 48px
    elevation: "{elevation.raised}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.full}"
    padding: 10px 16px
    border: "1px solid {colors.hairline}"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.full}"
    padding: 10px 16px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 20px
    elevation: "{elevation.card}"
  doctor-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 16px
    elevation: "{elevation.card}"
  appointment-card:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.on-primary-soft}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 20px
  list-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.none}"
    padding: 16px 20px
    border: "0 0 1px 0 solid {colors.hairline}"
  avatar:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.on-primary-soft}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.full}"
    size: 48px
  badge:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-pressed}"
    typography: "{typography.overline}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  status-pill:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  bubble-me:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
  bubble-them:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
    border: "1px solid {colors.hairline}"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 24px 20px
    elevation: "{elevation.sheet}"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.mute}"
    typography: "{typography.tab-label}"
    rounded: "{rounded.none}"
    height: 64px
    border: "1px 0 0 0 solid {colors.hairline}"
  tab-item-active:
    textColor: "{colors.primary}"
    typography: "{typography.tab-label}"
  app-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-lg}"
    rounded: "{rounded.none}"
    height: 56px
  call-control:
    backgroundColor: "rgba(255,255,255,0.14)"
    textColor: "{colors.on-night}"
    rounded: "{rounded.full}"
    size: 56px
  call-end:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    size: 64px
  banner-inline:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 16px
---

## Overview

Organic is built for one hand and one purpose: help someone who may be unwell
move calmly from worry to care. Every choice pushes toward warmth and trust and
away from the cold, dense, alert-red feel of most medical software.

The canvas is **oat paper** (`{colors.canvas}` — `#FAF7F1`), not white — a warm,
low-glare ground that reads as natural light rather than a screen. Content rests
on it as **pebble cards** (`{rounded.lg}` — 20px) with soft, diffuse shadows
(`{elevation.card}`), so the interface feels like objects laid on a table, not
boxes drawn on a grid. The primary is a **healing sage green**
(`{colors.primary}` — `#3E7A5E`): confident but botanical, used for every primary
action and every "you're on track" moment. A single **clay accent**
(`{colors.accent}` — `#C97B5A`) adds warmth for highlights, badges, and Sehat
Plus — the only warm color, kept scarce so it stays special.

Type carries the emotional register. Headings are set in **Fraunces**, a soft
humanist serif with gentle curves, at a comfortable medium weight — it makes a
screen title feel written, human, reassuring. Everything functional (body,
labels, buttons, inputs) is **Inter**, a clean humanist sans that stays legible
at small sizes and on cheap Android panels. The serif/sans pairing is the
system's signature: warmth where you read, clarity where you act.

The layout is **phone-portrait, thumb-first**. A bottom tab bar anchors the five
core destinations; actions that need focus rise as **bottom sheets**; the primary
in-context action ("Consult now") floats as a pill FAB. Screens are a single
column with a 20px side gutter (`{spacing.screen-x}`) and generous vertical air —
the app never feels crowded, because a crowded health app feels alarming.

**Key characteristics**
- Warm oat-paper canvas (`{colors.canvas}`) instead of clinical white; pure white is reserved for cards/surfaces.
- Sage-green primary (`{colors.primary}`) for all primary actions and positive status; one clay accent (`{colors.accent}`), used sparingly.
- Fraunces (soft serif) for display/headings + Inter (humanist sans) for body/UI — the emotional/functional split.
- Generous rounding: 20px pebble cards, 28px sheets, fully-rounded pills and avatars.
- Soft, diffuse, low-opacity shadows (never hard borders as the primary separator) — objects on a table.
- Mobile-native chrome: bottom tab bar, bottom sheets, floating "Consult now" pill, safe-area aware.
- Calm semantics: success shares the brand green; danger is a muted brick (`{colors.danger}`), never a fire-engine red.

## Colors

### Brand & accent
- **Sage Primary** (`{colors.primary}` — `#3E7A5E`): every primary CTA, active tab, active chip, "me" chat bubble, and success state. The app's anchor.
- **Sage Pressed** (`{colors.primary-pressed}` — `#31624B`): pressed state for primary surfaces.
- **Sage Soft** (`{colors.primary-soft}` — `#E7F0EA`): tinted fill for secondary buttons, avatars, appointment cards, and quiet "positive" chips. On it, text uses `{colors.on-primary-soft}` (`#2C5A43`).
- **Clay Accent** (`{colors.accent}` — `#C97B5A`): the single warm accent — Sehat Plus, streaks/highlights, a "featured" tag. Scarce by design.
- **Clay Soft** (`{colors.accent-soft}` — `#F6E6DD`): accent badge fill; text uses `{colors.accent-pressed}`.

### Surface
- **Canvas** (`{colors.canvas}` — `#FAF7F1`): the warm oat-paper screen background. The dominant surface.
- **Canvas Sunken** (`{colors.canvas-sunken}` — `#F1ECE1`): inset wells, disabled fills, sheet scrims-on-paper.
- **Surface** (`{colors.surface}` — `#FFFFFF`): cards, inputs, tab bar, sheets — the "objects" that sit on the canvas.
- **Surface Soft** (`{colors.surface-soft}` — `#FBF9F4`): subtly warmed surface for nested panels.
- **Hairline** (`{colors.hairline}` — `#E8E2D5`): 1px warm divider — used for list rows and input borders, never as a card's main separator (shadow does that).

### Text
- **Ink** (`{colors.ink}` — `#2A2C26`): a warm, olive-tinted near-black. Headings, primary text.
- **Body** (`{colors.body}` — `#55584E`): default paragraph text — warm gray, softer than ink.
- **Mute** (`{colors.mute}` — `#8B8E83`): metadata, captions, inactive tab labels.
- **Ash** (`{colors.ash}` — `#B8BAAF`): disabled text, lowest-emphasis utility.

### Night mode
- **Canvas Night** (`{colors.canvas-night}` — `#1E211C`): deep forest-charcoal background for dark mode and the consultation call screen.
- **Surface Night** (`{colors.surface-night}` — `#272B24`): cards on night canvas.
- **On Night** (`{colors.on-night}` — `#F2EFE7`) / **Body Night** (`rgba(242,239,231,0.72)`) / **Mute Night** (`rgba(242,239,231,0.5)`): text ramp on night surfaces.
- **Hairline Night** (`{colors.hairline-night}` — `rgba(242,239,231,0.12)`): dividers on night canvas.

### Semantic
Health apps default to alarm; Organic deliberately softens it. Each state has a **soft** tinted background for banners/pills and a **saturated** foreground for icons/text.
- **Success** (`{colors.success}` — `#3E7A5E` / soft `#E7F0EA`): confirmed appointment, upload complete. Intentionally the brand green — success and brand are one feeling.
- **Warning** (`{colors.warning}` — `#C08A2E` / soft `#F6ECD8`): amber caution, "email not confirmed", offline banner.
- **Danger** (`{colors.danger}` — `#B4483C` / soft `#F6E0DC`): a muted brick red for destructive actions and validation errors — never a pure `#FF0000`.
- **Info** (`{colors.info}` — `#5B7C99` / soft `#E4ECF2`): neutral informational chips and tooltips.
- **Focus Ring** (`{colors.focus-ring}` — `rgba(62,122,94,0.35)`): 4px soft halo on focused inputs.

## Typography

### Font families
- **Fraunces** — a soft, humanist "old-style" serif with optical sizing and gentle terminals. Used for display and screen headings at weight 500 (medium). It gives Sehat its written, human, reassuring voice. Both open-source, so **no substitution needed** — ship the variable font, restrict to the sizes below.
- **Inter** — a humanist sans optimized for UI. Carries all functional roles (body, labels, buttons, inputs, tab labels) at weights 400 / 500 / 600. Chosen for small-size legibility on low-DPI Android screens.

### Hierarchy

| Token | Family | Size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|---|
| `{typography.display-xl}` | Fraunces | 34px | 500 | 1.15 | -0.4px | Screen hero ("Good morning, Alex") |
| `{typography.display-lg}` | Fraunces | 28px | 500 | 1.2 | -0.3px | Section title, sheet title |
| `{typography.heading-lg}` | Fraunces | 22px | 500 | 1.25 | -0.2px | App-bar title, card headline |
| `{typography.heading-md}` | Inter | 18px | 600 | 1.3 | -0.1px | Doctor name, list-group header |
| `{typography.body-lg}` | Inter | 17px | 400 | 1.55 | 0 | Primary reading text, list rows |
| `{typography.body-md}` | Inter | 15px | 400 | 1.5 | 0 | Card body, chat text, secondary copy |
| `{typography.body-strong}` | Inter | 15px | 600 | 1.4 | 0 | Inline emphasis, chip label, FAB label |
| `{typography.caption}` | Inter | 13px | 400 | 1.4 | 0.1px | Metadata, timestamps, helper text |
| `{typography.overline}` | Inter | 12px | 600 | 1.3 | 0.8px | Badge/section eyebrow, ALL-CAPS label |
| `{typography.button}` | Inter | 16px | 600 | 1 | 0.1px | Button label |
| `{typography.tab-label}` | Inter | 11px | 500 | 1.2 | 0.2px | Bottom tab label |

### Principles
Headings use the serif to feel human; nothing below 18px is ever set in Fraunces
(small serif reads fussy on-screen). Body sits at a comfortable 1.5–1.55 line
height — health copy is often anxious reading, so give it room. Keep the type
scale short: one display, one heading serif tier, and a tight Inter ramp. Resist
adding weights; the warmth comes from the serif, not from bold sans.

## Layout

### Spacing
- **Base unit:** 4px, stepping 8 / 12 / 16 / 20 / 24 / 32 / 40.
- **Tokens:** `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.md}` 16 · `{spacing.lg}` 20 · `{spacing.xl}` 24 · `{spacing.xxl}` 32 · `{spacing.huge}` 40.
- **Screen gutter:** `{spacing.screen-x}` (20px) left/right on every screen. Cards inset from this, never bleed to the edge except full-width media.
- **Rhythm:** 24–32px between major sections within a screen; 12–16px between stacked cards; 20px in-card padding. Give the primary CTA at least 24px of breathing room above the tab bar / safe area.

### Structure (phone-first)
- **App bar** (`{component.app-bar}`, 56px): screen title in Fraunces, optional back chevron left, at most one action right. Sits on canvas, not a colored band.
- **Bottom tab bar** (`{component.tab-bar}`, 64px + safe area): five destinations — Home, Doctors, Appointments, Messages, Profile (patient) / Home, Requests, Schedule, Messages, Profile (doctor). Icon + `{typography.tab-label}`; active item in `{colors.primary}`.
- **Bottom sheets** (`{component.bottom-sheet}`): the default surface for focused actions — booking confirm, slot picker, filters, upload options. Rounded `{rounded.xl}` top corners, drag handle, `{elevation.sheet}`.
- **Floating "Consult now" pill** (`{component.fab-consult}`): the one persistent shortcut into an instant consult, floating bottom-right above the tab bar on patient Home/Doctors.
- **Single column:** content is one column; two-up only for small stat tiles or a doctor's day at a glance.

### Whitespace philosophy
Air is a feature. A slightly-too-empty health screen feels calm; a dense one
feels like an emergency room. Prefer fewer items with more space over exhaustive
lists. Let the oat canvas show between pebble cards — the gaps are part of the
design, not wasted space.

## Elevation & depth

| Token | Shadow | Use |
|---|---|---|
| `{elevation.flat}` | none | Canvas, list rows separated by hairline, tab labels |
| `{elevation.raised}` | `0 2px 8px rgba(42,44,38,0.06)` | Search field, primary button at rest, chips |
| `{elevation.card}` | `0 6px 20px rgba(42,44,38,0.08)` | Pebble cards, doctor cards — the default object shadow |
| `{elevation.sheet}` | `0 -8px 32px rgba(42,44,38,0.12)` | Bottom sheets (upward shadow) |
| `{elevation.float}` | `0 10px 28px rgba(49,98,75,0.22)` | Floating "Consult now" pill — a green-tinted lift |

Shadows are **warm-gray, wide, and low-opacity** — soft daylight, never a hard
drop. Depth reads as objects resting on paper. Cards do not gain a border and a
shadow at once; shadow is the separator, hairline is only for internal dividers
(list rows, input outlines). The one colored shadow is the FAB's green glow,
signaling its primacy.

## Shapes

### Radius scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed media, tab bar, app bar, list rows |
| `{rounded.sm}` | 8px | Small inline tags, image thumbnails |
| `{rounded.md}` | 14px | Text inputs, inline banners, secondary tiles |
| `{rounded.lg}` | 20px | Pebble cards, doctor cards, chat bubbles — the signature radius |
| `{rounded.xl}` | 28px | Bottom-sheet top corners, large hero cards |
| `{rounded.full}` | 9999px | Every pill CTA, chip, avatar, status pill, FAB, call control |

The vocabulary is deliberately round. A right angle appears only where content
must go edge-to-edge (media, bars). The 20px card + pill CTA pairing is the whole
shape language — pebbles and lozenges, nothing sharp.

### Imagery & iconography
- **Avatars:** circular, `{colors.primary-soft}` fill with initials in `{colors.on-primary-soft}` when no photo — matches the web app's initials+color convention.
- **Icons:** rounded-stroke line icons (2px, round caps/joins) — Lucide or Phosphor "regular". Never sharp/filled-heavy sets.
- **Illustration:** optional soft botanical line-art (leaves, seeds) as empty-state and onboarding art, in `{colors.primary}` / `{colors.accent}` at low opacity. Keep it sparse.
- **Doctor/specialty imagery:** photos in `{rounded.lg}` frames; specialty glyphs echo the web app's emoji-forward specialties but rendered as tinted line icons in production.

## Components

> Mobile system: each spec covers Default and Pressed/Active. No hover states.

### Buttons
**`button-primary`** — the primary action pill. `{colors.primary}` fill, `{colors.on-primary}` text, `{typography.button}`, `{rounded.full}`, 54px tall, full-width in sheets, `{elevation.raised}`. "Book appointment", "Confirm", "Send". Pressed → `{colors.primary-pressed}`.

**`button-secondary`** — soft-fill secondary. `{colors.primary-soft}` fill, `{colors.on-primary-soft}` text, same shape/height. Lower-priority affirmatives ("Message doctor", "Reschedule").

**`button-ghost`** — quietest action. Transparent with a 1px `{colors.hairline}` border, `{colors.primary}` text. Tertiary/"not now" actions.

**`button-danger`** — destructive. `{colors.danger-soft}` fill, `{colors.danger}` text — soft, not alarming. "Cancel appointment", "Delete". Confirm destructive actions in a sheet.

**`button-disabled`** — `{colors.canvas-sunken}` fill, `{colors.ash}` text, no shadow.

**`fab-consult`** — floating "Consult now" pill. `{colors.primary}` fill, label + bolt/video glyph, `{rounded.full}`, `{elevation.float}` (green glow). One per screen, patient side only.

### Inputs
**`text-input`** / **`text-input-focused`** — `{colors.surface}` fill, 1px `{colors.hairline}`, `{rounded.md}`, 54px, `{typography.body-lg}`. Focus swaps to a 2px `{colors.primary}` border + 4px `{colors.focus-ring}` halo. Labels sit above in `{typography.body-strong}`; helper/error text below in `{typography.caption}` (error uses `{colors.danger}`).

**`search-field`** — pill search. `{colors.surface}`, `{rounded.full}`, 48px, `{elevation.raised}`, magnifier glyph left. Top of the Doctors screen.

### Chips
**`chip`** / **`chip-active`** — filter/segment chips. Default: `{colors.surface}` with hairline border, `{colors.body}` text. Active: `{colors.primary}` fill, `{colors.on-primary}` text. Used for specialty/mode/sort filters in the search sheet.

### Cards
**`card`** — the base pebble. `{colors.surface}`, `{rounded.lg}`, 20px padding, `{elevation.card}`. The default container for everything.

**`doctor-card`** — avatar + name (`{typography.heading-md}`) + specialty (`{colors.mute}`) + a rating `{component.status-pill}` + fee, with a `{component.button-secondary}` "Book". `{rounded.lg}`, `{elevation.card}`.

**`appointment-card`** — upcoming visit. `{colors.primary-soft}` fill (a calm, positive tint), doctor + date/time + mode, with a "Join" `{component.button-primary}` when the consult is live. Sage-soft signals "this is handled".

**`list-row`** — settings/records/notification rows. `{colors.surface}`, flat, 16×20 padding, 1px `{colors.hairline}` bottom rule, chevron-right in `{colors.mute}`.

### Identity & status
**`avatar`** — 48px circle, `{colors.primary-soft}` + initials. Sizes: 32 (row), 48 (default), 72 (profile header).

**`badge`** — clay tag. `{colors.accent-soft}` fill, `{colors.accent-pressed}` text, `{typography.overline}`, pill. "PLUS", "NEW".

**`status-pill`** — appointment/verification status. Soft-tint pill mapped to state: `Upcoming`/`Completed` → success; `Pending` → warning; `Cancelled` → danger. `{typography.caption}`.

### Messaging
**`bubble-me`** — `{colors.primary}` fill, white text, `{rounded.lg}` with a squared tail corner, right-aligned.
**`bubble-them`** — `{colors.surface}` fill, `{colors.ink}` text, hairline border, left-aligned. Timestamps in `{typography.caption}` `{colors.mute}` below the run. Attachments render as an image thumb (`{rounded.md}`) or a file chip.

### Surfaces & chrome
**`bottom-sheet`** — `{colors.surface}`, `{rounded.xl}` top, drag handle (`{colors.ash}` 36×4 pill), 24×20 padding, `{elevation.sheet}`, dim scrim behind. The primary action surface.

**`tab-bar`** — `{colors.surface}`, 64px + safe-area inset, 1px `{colors.hairline}` top rule, 5 items (icon + `{typography.tab-label}`). Active item → `{component.tab-item-active}` (`{colors.primary}`); inactive → `{colors.mute}`.

**`app-bar`** — `{colors.canvas}` (blends into the screen), 56px, Fraunces title, single right action max.

**`banner-inline`** — inline status strip. Soft-tint background per semantic (default warning), `{rounded.md}`, icon + `{typography.body-md}`. Offline, unconfirmed-email, upload-failed.

### Consultation (call screen)
The call screen flips to **night canvas** (`{colors.canvas-night}`) so video reads well and controls recede.
**`call-control`** — 56px translucent circle (`rgba(255,255,255,0.14)`), white glyph — mute, camera, flip, chat. **`call-end`** — 64px `{colors.danger}` circle. Controls sit in a bottom cluster over a subtle gradient scrim; the remote video is full-bleed, local video a small `{rounded.lg}` PiP top-right.

## Do's and don'ts

### Do
- Keep the canvas warm paper (`{colors.canvas}`); reserve pure white (`{colors.surface}`) for cards and inputs — the contrast is what makes cards feel like objects.
- Use `{colors.primary}` (sage) for both primary actions and success — in Sehat, "done" and "brand" are the same calm green.
- Set every screen title and card headline in **Fraunces**; set every button, label, and body run in **Inter**.
- Separate cards with `{elevation.card}` shadow and space, not borders. Use `{colors.hairline}` only for list-row and input dividers.
- Put focused actions in a `{component.bottom-sheet}`; keep primary CTAs thumb-reachable near the bottom.
- Keep the clay accent (`{colors.accent}`) scarce — Plus, a single highlight — so it stays meaningful.
- Meet 44×44pt touch targets; buttons are 54px, tab/call controls ≥ 56px.

### Don't
- Don't use pure `#FFFFFF` as the screen background — it reads clinical and flattens the card system.
- Don't use a saturated/fire-engine red anywhere. Destructive and error states use the muted brick `{colors.danger}` on a soft tint.
- Don't set body, labels, or anything under 18px in Fraunces — the serif is for headings only.
- Don't add hard drop shadows or 1px borders as a card's main separator — Organic is soft daylight, not hard edges.
- Don't introduce a second accent or a blue primary. One sage, one clay — that's the palette.
- Don't crowd. If a screen feels full, cut items or paginate; density reads as alarm in a health app.
- Don't square the corners of CTAs or cards below `{rounded.lg}` — the round geometry is the brand.

## Adaptive behavior

Organic is phone-portrait first; it scales up rather than reflowing dramatically.

| Context | Behavior |
|---|---|
| Small phones (≤ 360dp) | Screen gutter tightens to 16px; display-xl scales 34 → 28px; cards stay full-width. |
| Standard phones (360–430dp) | Default spec. |
| Large phones / foldables (≥ 480dp) | Content column caps at ~440dp centered; two-up doctor cards allowed; sheets cap width and center. |
| Tablet (out of v1 scope) | If pursued: the column stays ~440dp with the canvas widening around it — never stretch cards full-bleed. |
| Landscape | Only the call screen supports landscape; all other screens lock portrait. |
| Dynamic type | Respect OS text scaling up to ~130%; cards grow vertically, never truncate body. Tab labels may hide above 130%, leaving icons. |
| Dark mode | Swap canvas → `{colors.canvas-night}`, surface → `{colors.surface-night}`, text ramp → on-night set; primary/accent stay, semantics keep their hues on darker soft-tints. |
| Safe areas | Tab bar, FAB, and bottom CTAs inset above the home indicator; app bar insets below the status bar/notch. |

## Iteration guide

1. Work one component at a time; pull its YAML entry and confirm every `{...}` reference resolves.
2. Reference tokens directly (`{colors.primary}`, `{component.card}`, `{rounded.lg}`) — never paraphrase a hex or size inline.
3. Default text to `{typography.body-lg}`; reach for Fraunces (`display-*`, `heading-lg`) only for titles and card headlines.
4. Before adding a token, check the pebble-card + pill + soft-shadow vocabulary can't already express it. The system's strength is its small palette.
5. Keep the clay accent scarce and the danger red muted — these two restraints carry the "calm health" feeling more than any single component.
6. New status? Add a soft/saturated pair to the semantic set rather than a one-off color.
7. Check contrast: `{colors.body}` on `{colors.canvas}` and all on-tint pairs must clear WCAG AA (4.5:1 for text).

## Known gaps

- **Onboarding & empty-state illustration** style is described (soft botanical line-art) but not specified as assets — needs an illustration kit.
- **Doctor-side dense views** (schedule grid, earnings charts) are sketched via `card` + `status-pill` but a data-viz sub-spec (chart colors, axis type) is not yet defined.
- **Prescription document** layout (the shareable/downloadable PDF) is out of this UI system's scope.
- **Motion** — transitions (sheet spring, tab cross-fade, card press-scale) are not tokenized here; define a motion scale (durations/easing) as a follow-up.
- **Full night-mode audit** — night tokens are provided but each component's night variant should be verified for AA contrast before shipping dark mode.
