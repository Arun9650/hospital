# Aria Health — Telemedicine Platform

A production-ready, fully responsive telemedicine web app where patients discover
doctors, book appointments, consult online, manage records, receive digital
prescriptions, and where doctors and admins run their own portals.

Built with **Next.js 16 (App Router) · React 19 · Tailwind CSS v4**, using a
strict **PlayStation-inspired design system** adapted for healthcare
(`DESIGN-playstation.md`): alternating dark / light / blue full-bleed canvases,
light-weight editorial display type (Roboto 300), pill CTAs, 8px cards, minimal
shadows, generous section rhythm, and blue reserved only for primary actions.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint (clean)
```

All data is mock/dummy (`lib/data.ts`) — no backend required.

## Routes

**Marketing**
- `/` — Landing (hero, search, specialties, featured doctors, how it works,
  online consultation, services, testimonials, FAQ, blue CTA band, footer)
- `/login`, `/register` — auth with multi-step profile completion

**Patient** (`/patient/*`)
- `dashboard` · `doctors` (search + filters) · `doctors/[id]` (profile) ·
  `book/[id]` (booking wizard → payment → confirmation) · `consultation`
  (video) · `appointments` · `records` · `prescriptions` · `assistant` (AI) ·
  `notifications`

**Doctor** (`/doctor/*`)
- `register` (credentials + license upload + verification) · `dashboard` ·
  `appointments` (requests) · `consultation` (clinical workspace) · `patients` ·
  `prescriptions` (builder with live preview) · `earnings` · `availability`

**Admin** (`/admin/*`)
- `dashboard` · `patients` · `doctors` · `appointments` · `revenue` ·
  `verification` · `reports` · `content` · `notifications`

## Architecture

- `components/ui.tsx` — Button, Avatar, Badge, Stars, Section, Stat, Field, etc.
- `components/` — SiteNav, SiteFooter, DoctorCard, AppointmentCard,
  DashboardShell (role sidebars), Tabs, Accordion, DataTable, HeroSearch,
  RateButton, NotificationsView, AuthShell, and role shells.
- `app/globals.css` — design tokens mapped to the PlayStation system + component
  classes (`.btn`, `.card`, `.chip`, `.field`, canvas sections).
- `lib/data.ts` — doctors, specialties, appointments, prescriptions, reviews,
  services, notifications, earnings and admin datasets.

> For demonstration only — not a real medical service.
