# AI Usage Log

## Tools Used

**Claude Code (Anthropic)** — primary AI assistant used during the initial implementation.

**Codex (OpenAI)** — used for a later audit, refactor, verification, and documentation pass.

---

## What I Used AI For

### 1. Architecture planning

**Prompt style:** "Given these requirements [PDF summary], recommend the best framework, state management approach, folder structure, and test setup."

**What it got right:** The comparison between useReducer+Context vs Zustand for this scope was accurate — it correctly identified that Zustand's overhead wasn't justified for a single-domain app, and that `useReducer` makes state transitions more testable. The Next.js vs React recommendation (Next.js wins for portfolio signal + built-in TypeScript wiring) was sound.

**What I adjusted:** AI initially suggested URL search params for filter state. I overrode this and kept filters in component state — for a _personal_ task manager there's no URL-sharing use case, and in-memory state is simpler and faster.

### 2. TypeScript types

**Prompt style:** "Define clean TypeScript types for Task, Priority, Status, FilterState, SortState using const objects for enums."

**What it got right:** The `as const` pattern for enum-like constants and `keyof typeof` for derived types — this is the correct TypeScript-idiomatic approach (avoids TS `enum` pitfalls).

**What I adjusted:** Added `PRIORITY_ORDER` weight map separately to keep sorting logic clean and testable, which wasn't in the initial suggestion.

### 3. Zod validation schema

**Prompt style:** "Write a Zod schema for the task form with inline validation messages for character limits and required fields."

**What it got right:** The `.refine()` call for whitespace-only title detection was correct. Using `z.enum` with a custom `errorMap` for better messages was a good pattern.

**What I verified:** Ran all boundary cases through the test suite — schema correctly catches `' '.trim().length === 0` inputs, which raw `z.string().min(1)` would miss.

### 4. useReducer pattern

**Prompt style:** "Write a taskReducer with HYDRATE, ADD_TASK, UPDATE_TASK, DELETE_TASK, REORDER_TASKS, SET_FILTER, SET_SORT, CLEAR_FILTERS actions."

**What it got right:** The action union type pattern with discriminated unions was correct. The HYDRATE action for SSR-safe localStorage hydration was a good suggestion.

**What I corrected:** The initial context implementation was calling `dispatch({ type: 'ADD_TASK' })` in a loop to hydrate, which would create duplicate IDs and trigger multiple re-renders. I replaced this with a single HYDRATE action that sets state atomically.

### 5. @dnd-kit drag-and-drop hook

**Prompt style:** "Extract a useTaskDnd hook from @dnd-kit with PointerSensor and KeyboardSensor, handling the DragEndEvent."

**What it got right:** The activation constraint `{ distance: 5 }` is a good default to prevent accidental drag triggering on clicks. The `arrayMove` pattern from `@dnd-kit/sortable` was correctly applied.

**What I added:** Disabled drag when filters are active (AI didn't flag this edge case) — reordering filtered results and mapping those indices back to the unfiltered array would be incorrect without extra bookkeeping.

### 6. Test suite

**Prompt style:** "Write Vitest + React Testing Library tests for [component/hook/util] covering [specific behaviors]."

**What it got right:** The mock pattern for `@dnd-kit/sortable`'s `useSortable` was correct — without mocking it, the hook throws because there's no DnD context in tests.

**What I corrected:**

- The delete confirmation test initially looked for text that was only in a `title` attribute (tooltip), not rendered text. I updated the test to check the `aria-label` change on the button and the visible hint paragraph.
- The `useTasks` hook tests needed a localStorage mock because jsdom's localStorage throws on some operations — I added an explicit mock before the test suite.

### 7. Boilerplate (layout, CSS, config files)

Used AI to scaffold `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, and `vitest.config.ts`. These are standard configurations — verified each matches the requirements (strict TypeScript, prettier integration, coverage thresholds).

### 8. Senior audit and refactor pass

**Prompt style:** "Perform a comprehensive audit against architecture, TypeScript quality, testing, UI/UX, performance, and engineering judgment. Do not provide only recommendations; implement appropriate improvements while preserving functionality."

**What it found:**

- `TaskForm.tsx` and `TimePicker.tsx` are the main architectural hotspots because they are large and combine UI, state, and business-flow logic.
- Persistence code was duplicated across task, timer, and coffee-tracker state.
- Several persisted-state reads used unsafe casts after `JSON.parse`.
- URL-derived priority filters were being trusted through a type assertion.
- `TaskRangePicker` tests relied on button indexes and a UTC fake clock, which made the test brittle across environments.

**What was implemented:**

- Added `lib/storage.ts` with shared `readStorage` and `writeStorage` helpers.
- Added Zod-backed validation for persisted task, timer, and coffee-tracker data before hydrating app state.
- Centralized priority option constants and reused them in both TypeScript types and Zod validation.
- Added an `isPriority` type guard for URL query parsing.
- Removed duplicated task normalization between reducer create and edit paths.
- Added accessible labels for TimePicker spinner buttons.
- Updated the TimePicker test to use accessible names instead of button indexes.
- Fixed timezone-sensitive fake timer setup by using a local `Date` constructor.
- Added storage utility tests for valid data, missing data, malformed JSON, schema-invalid JSON, and write failures.

**What I verified:**

- `npx tsc --noEmit` passes.
- `npm test` passes with 16 test files and 162 tests.
- Coverage remains above configured thresholds: 76.03% statements, 70.25% branches, 78.24% functions, 78.41% lines.
- `npm run build` passes.

**What I intentionally did not do:** I did not split `TaskForm.tsx` or `TimePicker.tsx` in this pass. That would be valuable, but it is a larger refactor with higher regression risk. The safer assessment-focused change was to isolate duplicated persistence/business logic first, improve type safety, and document the remaining decomposition as technical debt.

---

## Summary Assessment

AI was most valuable for: boilerplate scaffolding, TypeScript patterns, and test structure. It saved significant time on well-defined problems with known correct answers.

AI required correction on: edge cases it couldn't infer from a prompt alone (localStorage hydration race condition, filter-disabled-drag interaction, timezone-sensitive tests, and test assertions against DOM structure it hadn't rendered). These required me to actually run the code and think through the behavior.

The net effect: faster first drafts and a stronger review loop, but every generated change was read, understood, tested, and adjusted before committing. AI-generated code that I don't understand line-by-line doesn't belong in production.
