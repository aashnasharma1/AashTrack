# AashTrack - Mini Task Management Dashboard

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
- **Schedule tasks** with start/end date-time handling, duration presets, custom durations, and past-time clamping
- **Conflict-aware scheduling** — higher-priority tasks block overlapping equal/higher priority work and can shift lower-priority tasks
- **Collections** — group tasks into project-like collections with dedicated collection pages
- **Inline status cycle** — click any status badge to cycle To Do → In Progress → Done without opening the edit modal
- **Custom status groups** — manage, reorder, and color status lanes while retaining sensible defaults
- **Priority** (Low / Medium / High) and **Status** visible on every task card and table row
- **Filter** by status, priority, or collection — filter chips in the toolbar
- **Text search** — type to filter tasks by title or description; press `/` to focus the search field
- **Sort** by date, priority, or title — toggleable asc/desc; drag-and-drop switches to manual order mode
- **Drag-and-drop reorder** via @dnd-kit (keyboard accessible; disabled while filters or search are active)
- **Three view modes** — grouped list, kanban board, and resizable table
- **Timeline and timer views** — dashboard timeline, task timer, history page, and workload summaries
- **Dark mode** — system default + manual toggle
- **Empty state** — distinct states for "no tasks" vs "no matching filters/search"
- **Inline validation errors** — required fields, character limits (title: 30, description: 300)
- **Confirmation step** on delete — double-click guard against accidental deletion
- **localStorage persistence** — tasks, timer history, coffee progress, and preferences survive refresh
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

**Why URL params only where useful?**  
The main task list syncs filter state into URL params so filtered views can survive refreshes and be shared during review. Collection detail pages lock the collection scope and keep the URL clean. Sort preference is persisted in localStorage so it survives page refresh.

### Folder Structure

```
app/               → Next.js App Router (layout, page)
components/
  dashboard/       → Timeline, timer, workload, and dropdown widgets
  layout/          → Header, Sidebar, NavbarTimer, ThemeToggle
  task/            → TaskForm, TaskList, views, table rows, status manager
  ui/              → Shared primitives: Button, Input, Textarea, Badge, Modal, Date/Time pickers
context/           → TaskContext and TimerContext providers
hooks/             → Domain hooks for tasks, DnD, inline edit, timer, coffee tracker
lib/               → Reducer, scheduling engine, validation, storage, time utilities
types/             → Task, Priority, Status, FilterState, SortState
utils/             → taskUtils (pure functions: filter, sort, format, truncate)
__tests__/         → Unit tests mirroring source structure
```

### Validation and Persistence

Zod provides TypeScript-first form validation and schema validation at persistence boundaries. localStorage reads are centralized through `lib/storage.ts`, so malformed or stale persisted data falls back safely instead of being trusted through unsafe casts.

### Scheduling Engine

Scheduling logic lives outside UI components in `lib/scheduling.ts`. The engine converts scheduled tasks into absolute minute ranges, detects overlaps, blocks equal/higher priority conflicts, and shifts lower-priority conflicts to the next available slot. This keeps the business rules testable without rendering React components.

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
- `TimePicker`, `DatePicker`, `RecurrencePicker`, and scheduling edge cases
- Bulk task table creation/edit flows
- Storage helper behavior for valid, missing, malformed, invalid, and write-failure cases
- `EmptyState` component (filtered vs unfiltered state)
- `Badge` components

Current local audit run: **16 test files / 162 tests passing**.

Latest coverage summary:

- Statements: **76.03%**
- Branches: **70.25%**
- Functions: **78.24%**
- Lines: **78.41%**

Coverage remains above the configured 70% thresholds. `npm run build` also passes.

## Code Quality Tooling

- **ESLint**: `next/core-web-vitals` + `@typescript-eslint/recommended` + `prettier` integration. No `any` types enforced.
- **Prettier**: single quotes, trailing commas, 100-char print width, `prettier-plugin-tailwindcss` for class ordering.
- **Husky + lint-staged**: pre-commit hook runs `eslint --fix` and `prettier --write` on staged files.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): runs lint → type-check → tests → build on every push and pull request to `main`.

## Recent Audit Improvements

- Centralized localStorage read/write behavior in `lib/storage.ts`.
- Replaced unsafe persisted-state casts with Zod-validated schemas in task, timer, and coffee state.
- Shared priority constants between TypeScript types and Zod validation.
- Added a type guard for URL-derived priority filters.
- Removed duplicated reducer normalization between task create and edit paths.
- Added accessible labels to TimePicker spinner controls.
- Fixed timezone-sensitive TimePicker tests by using a local fake clock instead of a UTC instant.
- Added storage utility tests.

## Known Trade-offs & What I'd Do With More Time

- **No optimistic updates**: unnecessary for localStorage-only — operations are synchronous.
- **Large components remain**: `TaskForm.tsx` and `TimePicker.tsx` should be decomposed into smaller sections/hooks in a follow-up refactor.
- **No Playwright E2E tests**: would add full create → schedule → search → status-cycle → delete flows covering the happy path.
- **No virtualization**: for hundreds of tasks, a windowed list (e.g. `@tanstack/react-virtual`) would be needed.
- **Single-page layout**: would add a task detail route (`/tasks/[id]`) for richer viewing on larger screens.
