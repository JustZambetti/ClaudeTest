# Changelog

All notable changes to this project are documented here.
Entries are organized by development phase, then by commit.

---

## Phase 1 — Foundation
**Goal:** Project scaffold, TypeScript schema, story engine modules, Zustand stores, sample story.

### Commit: `f4c9afa` — Add project design plan document
- Created `DESIGN_PLAN.md` capturing full architecture, data schema, UI/UX spec, and phased development plan.
- Documents the story format decision (JSON + JSONLogic-style conditions over Ink/DSL/eval).
- Captures all design Q&A: directed graph structure, hidden state, state-driven outcomes (not choices), auto-save, animated URL replay, Reigns visual style, 3 save slots.

### Commit: `9c31df8` — Phase 1: project scaffold, types, engine, stores, and sample story
- **Toolchain**: Vite 7 + React 19 + TypeScript + Tailwind CSS v4 (via `@tailwindcss/vite`) + Framer Motion + Zustand + `@use-gesture/react`.
- **`src/types/story.ts`**: Complete TypeScript types for the story schema — conditions (`Condition`, `ConditionOperand`), state definitions (`InitialState`, `StoryState`), all three event types (`ChoiceEvent`, `NarrativeEvent`, `EndingEvent`), type guards, and `HistoryEntry`.
- **Story engine** (pure, side-effect-free modules):
  - `conditionEvaluator.ts` — safe JSONLogic tree-walker, no `eval()`
  - `stateManager.ts` — numeric delta application with min/max clamping; boolean/string direct set
  - `graphTraverser.ts` — resolves the first matching outcome branch for a given choice + state
  - `imagePreloader.ts` — `new Image()` background preloader with dedup cache
  - `pathReplayer.ts` — silently reconstructs full game state from a `choicePath[]` (for URL sharing)
- **Zustand stores**:
  - `gameStore.ts` — runtime state (current event, card phase, hidden story state, history, choice path, active save slot); auto-persisted to `localStorage`
  - `savesStore.ts` — 3 named save slots with save/delete operations; auto-persisted to `localStorage`
- **`public/story.json`**: Demo story "The Lost Heir" — 15 events, 4 state variables (`suspicion`, `trust`, `gold`, `hasKey`), 4 distinct endings, narrative events, epilogue chains, converging paths.
- **Build verified**: `tsc -b && vite build` passes with zero errors or warnings.

---

## Phase 3 — Core Card UI
**Goal:** EventCard with flip animation, CardFront/CardBack components, GameScreen wiring, ending screen.

### Commit: `(pending)` — Phase 3: core card UI components and GameScreen

**`src/components/UI/ImageWithShimmer.tsx`**
- Renders an image with a shimmer skeleton while loading (CSS `@keyframes shimmer` + `animate-pulse`).
- Fades the image in on `onLoad` via opacity transition.
- Shows a "No image" fallback on `onError`.
- Applies a bottom-edge gradient vignette to blend the image into the card body.

**`src/components/EventCard/CardFront.tsx`**
- Renders the front face of an event card: image (via `ImageWithShimmer`), story text, and action buttons.
- Choice event variant: two side-by-side choice buttons. Tapping a button highlights it (125ms visual feedback) then calls `onSelectChoice`. Buttons are disabled during the flip.
- Narrative event variant: a single centered "Continue" button calls `onContinueNarrative`.
- Text area is `overflow-y-auto` with hidden scrollbars for long story text.

**`src/components/EventCard/CardBack.tsx`**
- Renders the back face: consequence image, "You chose: …" label, consequence text (italic), and a "Continue →" button.

**`src/components/EventCard/EventCard.tsx`**
- Flip animation: uses Framer Motion `AnimatePresence mode="wait"` with `scaleX: 0 → 1` half-flip transitions (0.18s each). Front collapses to edge, back expands from edge — reliable cross-browser card flip without CSS `preserve-3d`.
- Local `faceShowing` state syncs from the persisted `cardPhase` store value, so refreshing the page on the back face restores the correct face.
- `onExitComplete` callback advances the store from `'flipping'` to `'back'` after the exit animation finishes, keeping the Continue button non-interactive during the animation.

**`src/components/GameScreen.tsx`**
- Card advance animation: `AnimatePresence mode="wait"` with `key={currentEvent.id}`. New card slides in from right (x: 80 → 0, opacity 0→1, scale 0.95→1); old card exits left (x: 0→-80, scale 1→0.9).
- Phase 3 auto-start: if `currentEventId` is empty, calls `startNewGame(1)` automatically (replaced by TitleScreen in Phase 4).
- Ending screen: dedicated layout with ending image, divider, title, text, and "Play Again" button. Animated in with `y: 20 → 0`.

**`src/App.tsx`**
- Fetches `/story.json` on mount; shows a loading state and error fallback.
- Renders `GameScreen` once story is loaded.

**`src/index.css`**
- Added `@keyframes shimmer` for the loading skeleton sweep.
- Added `.scrollbar-none` utility for hidden scrollbars.

---

## Phase 2 — Story Engine Tests + useStoryEngine Hook
**Goal:** Full unit test coverage of all engine modules; `useStoryEngine` hook wiring engine to stores.

### Commit: `(pending)` — Phase 2: engine unit tests and useStoryEngine hook

**Vitest setup:**
- Added `vitest` and `@vitest/ui` as dev dependencies.
- Created `vitest.config.ts` (separate from `vite.config.ts`) with `environment: 'node'` and `include: ['src/**/*.test.ts']`.
- Added `test` and `test:watch` npm scripts.

**Engine unit tests — 48 tests, 4 suites, all passing:**
- `conditionEvaluator.test.ts` (18 tests): all comparison operators (`>`, `>=`, `<`, `<=`, `==`, `!=`), logical operators (`and`, `or`, `not`), nested compound conditions, two-literal comparison, unknown state variable warning, unknown operator warning.
- `stateManager.test.ts` (13 tests): `buildInitialState` extraction and immutability, `applyStateChanges` positive/negative delta, max clamp, min clamp, uncapped numeric, boolean direct set, string direct set, multi-field changes, immutability of input, unknown key warning.
- `graphTraverser.test.ts` (8 tests): first condition match, null-condition fallback, single-outcome choice, unknown choice ID, no-match warning, `resolveOutcomeChanges` matching/missing/empty cases.
- `pathReplayer.test.ts` (9 tests): empty path, single choice with state advance, automatic narrative event traversal, state-dependent branching, full two-choice path, stopping at ending events, history correctness, invalid event ID, invalid choice ID.

**Type improvements:**
- `graphTraverser.ts`: extracted `OutcomeResult` type (pure consequence data) to decouple it from the store's `ResolvedOutcome`.
- `gameStore.ts`: `ResolvedOutcome` now includes `choiceId` and `choiceLabel` (full pending state for the card back face); added `loadFromSave` action.

**`src/hooks/useStoryEngine.ts`:**
- Orchestrates the full game loop: `selectChoice` → flip → `confirmConsequence` → advance → auto-save.
- `selectChoice(choiceId)`: resolves outcome branch, preloads consequence image immediately, sets `cardPhase = 'flipping'`, stores `pendingOutcome`.
- `confirmConsequence()`: applies `stateChanges` (with clamping), records `HistoryEntry`, advances `currentEventId`, triggers auto-save.
- `continueNarrative()`: advances narrative events, records history, triggers auto-save.
- `startNewGame(slotId)`: initialises fresh state from story's `initialState`, assigns save slot.
- `loadSave(slotId)`: restores full state from a `SaveSlot`.
- Lookahead preload: on every `currentEventId` change, preloads all reachable consequence and next-event images.
- Returns `{ currentEvent, cardPhase, isEnding, isNarrative, isChoice, selectChoice, confirmConsequence, continueNarrative, startNewGame, loadSave }`.
