# AashTrack — Mini Task Management Dashboard

A production-quality personal task manager built for the Trantor Frontend Developer take-home assignment.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test          # run all tests with coverage report
npm run lint      # ESLint check
npm run format    # Prettier format
npm run build     # production build
```

## Features

- **Create, edit, delete** tasks with full form validation
- **Inline status cycle** — click any status badge to cycle To Do → In Progress → Done without opening the edit modal
- **Priority** (Low / Medium / High) and **Status** (To Do / In Progress / Done) visible on every task card and table row
- **Filter** by status, priority, or collection — filter chips in the toolbar
- **Text search** — type to filter tasks by title or description; press `/` to focus the search field
- **Sort** by date, priority, or title — toggleable asc/desc; drag-and-drop switches to manual order mode
- **Drag-and-drop reorder** via @dnd-kit (keyboard accessible; disabled while filters or search are active)
- **Two view modes** — card view (with drag handles) and table view
- **Dark mode** — system default + manual toggle
- **Empty state** — distinct states for "no tasks" vs "no matching filters/search"
- **Inline validation errors** — required fields, character limits (title: 100, description: 500)
- **Confirmation step** on delete — double-click guard against accidental deletion
- **localStorage persistence** — tasks survive page refresh with a graceful fallback if storage is unavailable
- **Keyboard shortcuts** — `N` new task, `/` focus search, `?` show shortcuts panel, `Esc` dismiss
- **Accessible** — skip-to-main link, ARIA labels, focus trap in modal, focus restoration, `prefers-reduced-motion`, `aria-live` announcements, `aria-sort` on table headers

## Architecture

### Framework: Next.js 14 (App Router)

Chosen over plain React because:

- App Router provides a clean, scalable file structure that signals production awareness
- `next/font` + `next-themes` integrate cleanly with the SSR model
- TypeScript strict mode and ESLint configs are wired by default

### State Management: `useReducer` + React Context

**Why not Zustand or Redux?**  
This app has a single domain (tasks) with predictable CRUD operations. `useReducer` makes every state transition explicit, auditable, and easily testable in isolation without a third-party runtime. Context provides ergonomic access without prop-drilling. The trade-off vs Zustand is minor boilerplate — worth it to demonstrate understanding of React's own state primitives rather than reaching for a library by default.

**Why not URL params for filter state?**  
URL params work well for shareable filters in multi-user or team dashboards (e.g. Jira). For a _personal_ task manager the user never shares a URL with someone else — persisting filters in URL adds URL noise without benefit. `useReducer` + in-memory state gives instant updates with no serialization round-trips. Sort preference is persisted in localStorage so it survives page refresh.

### Folder Structure

```
app/               → Next.js App Router (layout, page)
components/
  layout/          → Header, ThemeToggle
  task/            → TaskCard, TaskForm, TaskList, FilterBar, EmptyState
  ui/              → Shared primitives: Button, Input, Textarea, Select, Badge, Modal
context/           → TaskContext (TaskProvider + useTaskContext)
hooks/             → useTasks (domain hook), useTaskDnd (drag-and-drop hook)
lib/               → taskReducer, validation schema (Zod), cn utility
types/             → Task, Priority, Status, FilterState, SortState
utils/             → taskUtils (pure functions: filter, sort, format, truncate)
__tests__/         → Unit tests mirroring source structure
```

### Form Handling: React Hook Form + Zod

Zero re-renders on keystroke (RHF's uncontrolled model), with Zod providing TypeScript-first schema validation. Character limits and required-field errors surface inline — no silent failures.

### Drag and Drop: @dnd-kit

Chosen over `react-beautiful-dnd` (unmaintained) and HTML5 DnD API (no touch support). @dnd-kit is accessible, touch-compatible, and used in my prior production work. Drag reorder is disabled while filters are active because the reordered index would not map back to the unfiltered list correctly.

### Styling: Tailwind CSS

Utility-first CSS with `tailwind-merge` + `clsx` for conditional class composition. Dark mode via `next-themes` with `class` strategy.

## Testing

**Vitest + React Testing Library**. Vitest is Jest-compatible but faster and native to the Next.js/Vite ecosystem. Coverage is measured with `@vitest/coverage-v8`.

Run: `npm test`

Tests cover:

- All utility functions (`filterTasks`, `sortTasks`, `generateId`, `truncate`, `formatRelativeDate`, etc.)
- Zod validation schema (all valid/invalid combinations)
- `taskReducer` (all action types)
- `useTasks` custom hook (CRUD, filter, sort, reorder)
- `TaskCard` component (render, edit, delete confirmation flow)
- `TaskForm` component (create/edit modes, validation, keyboard dismiss)
- `EmptyState` component (filtered vs unfiltered state)
- `Badge` components

**Coverage: ~89%** (lines) — above the 70% threshold.

## Code Quality Tooling

- **ESLint**: `next/core-web-vitals` + `@typescript-eslint/recommended` + `prettier` integration. No `any` types enforced.
- **Prettier**: single quotes, trailing commas, 100-char print width, `prettier-plugin-tailwindcss` for class ordering.
- **Husky + lint-staged**: pre-commit hook runs `eslint --fix` and `prettier --write` on staged files.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): runs lint → type-check → tests → build on every push and pull request to `main`.

## Known Trade-offs & What I'd Do With More Time

- **No URL-based filter state**: justified above. Would add it for a team-facing dashboard where filter links are shared.
- **No optimistic updates**: unnecessary for localStorage-only — operations are synchronous.
- **No Playwright E2E tests**: would add a full create → search → status-cycle → delete flow covering the happy path.
- **No virtualization**: for hundreds of tasks, a windowed list (e.g. `@tanstack/react-virtual`) would be needed.
- **Single-page layout**: would add a task detail route (`/tasks/[id]`) for richer viewing on larger screens.
