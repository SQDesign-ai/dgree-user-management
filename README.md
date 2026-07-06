# D.gree Yachting — Access management prototype

Interactive prototype of the **Access management** feature for the D.gree
Yachting fleet platform, built from the
[Figma designs](https://www.figma.com/design/Zy93tvOvtZoLZmclwr71fu/User-management).

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS v4** (design tokens defined in `src/index.css`)
- **react-router-dom** for client-side navigation
- **lucide-react** for icons

All data is mocked in `src/data/mock.ts` — no backend.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## Screens & flow

| Route | Screen |
| --- | --- |
| `/` | **Access management** — shipyards table + Sail ADV teams tab |
| `/groups/:groupId` | **Group** — shipyards within a group + group settings |
| `/shipyards/:shipyardId` | **Shipyard** — Teams and Yachts tabs |
| `/shipyards/:shipyardId/teams/:teamId` | **Team** — members list + linked yachts (owner-consent) |
| `/shipyards/:shipyardId/yachts/:yachtId` | **Yacht** — Owner-team roles + third-party Data access whitelist |

Rows are clickable, so you can navigate the whole hierarchy:
Access management → Shipyard → Team/Yacht, and Shipyard → Group.

## Domain model

The access model mirrors the Figma flow:

- **Groups** own **shipyards**; shipyards own **teams** and **yachts**.
- A yacht has an **owner-team** (Owner / Captain / Crew / Guest, with an
  optional **PoA** — power of attorney — on the owner).
- **Data access** to a yacht is granted to third parties via a whitelist.
  Shipyard access is automatic from delivery until the earlier of
  *shipyard delivery + 1 year* or *owner delivery*; afterwards the owner
  (or captain under PoA) grants access explicitly.

## Structure

```
src/
  components/   Layout (sidebar shell), PageHeader/Breadcrumbs, ui primitives
  data/mock.ts  Mock domain data + lookups
  pages/        One file per screen
```
