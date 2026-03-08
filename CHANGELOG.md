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

## Phase 8 — Polish & Demo Content
**Goal:** Full Reigns visual theme, EndingScreen component with Share, accessibility, active-slot indicator, expanded 30-event demo story.

### Commit: `(pending)` — Phase 8: polish, accessibility, EndingScreen, and expanded story

**`public/story.json`** — Expanded from 14 to 30 events (version 2.0):
- Added state variable `hasRecord` (bool, default false) — set true in all `archive_inside` outcomes; `confrontation` outcomes now check it to gate triumph.
- New mid-story events: `city_morning`, `market_debrief`, `inn_detour`, `inn_night`, `inn_morning`, `archive_exit`, `dawn_streets`, `harwick_private`, `bribed_path`, `council_eve`.
- Lord Harwick now appears in person (`harwick_private`) and offers a bribe; accepting leads to `ending_betrayal` ("The Price of Silence") via `bribed_path`.
- Archive exit choice: leave cleanly (suspicion −5) or copy the payment ledger (trust +10, suspicion +15 — extra evidence at a cost).
- `confrontation` has 4 outcome branches per choice: checks `hasRecord AND trust > 65` (triumph), `hasRecord AND suspicion > 60` (imprisoned), `hasRecord` (stalemate), and null fallback (exile). Fully state-driven.
- New endings: `ending_betrayal` ("The Price of Silence"), `ending_advisor` ("The Long Game").
- Epilogue chains added for stalemate, exile, imprisonment, and advisor paths. Triumph path now properly routes through `epilogue_triumph_1 → epilogue_triumph_2` (previously orphaned).
- Total: 30 events, 6 endings, 5 state variables.

**`src/components/EndingScreen.tsx`** — New component extracted from `GameScreen`:
- Full ending layout: image (`ImageWithShimmer`, `vignetteColor="#0f0e0d"`), divider, title, italic text.
- **Share button**: builds `?path=choicePath.join(',')` URL, copies to clipboard, shows a 2.5s "Link copied!" toast (AnimatePresence fade). Only rendered when `choicePath.length > 0`.
- "Play Again" is demoted to a quiet text link (less visually dominant than Share).

**`src/components/GameScreen.tsx`**:
- Ending screen replaced with `<EndingScreen ending={...} choicePath={choicePath} onPlayAgain={onReturnToTitle} />`.
- Added `activeSaveSlot` from game store; slot badge rendered on hamburger button: amber circle with slot number, positioned top-right of the button. `aria-label` on the button includes the slot number.

**`src/components/EventCard/CardFront.tsx`** — Accessibility:
- Added `useRef` + `useEffect` for focus management: when a new card mounts, focuses the first interactive element (first choice button or Continue button) on `pointer: fine` devices only — avoids triggering the virtual keyboard on mobile touch screens.
- Story text paragraph has `aria-live="polite"` so screen readers announce each new event.

**`src/components/EventCard/EventCard.tsx`**:
- Card container has `role="article"` and `aria-label="Story card"`.

**`src/components/Carousel/Carousel.tsx`**:
- Scroll container has `role="region"` and `aria-label="Story history"`.

**`src/index.css`**:
- Added `body::after` pseudo-element with an SVG `feTurbulence` fractalNoise pattern at `opacity: 0.035` and `background-size: 200px`. This adds a subtle film-grain texture over the entire app without affecting pointer events or z-index of interactive content.

---

## Phase 7 — Image Preloading
**Goal:** Robust preloading coverage, shimmer on every image surface, bulk replay pre-warming.

### Commit: `(pending)` — Phase 7: image preloading improvements

**`src/components/UI/ImageWithShimmer.tsx`**
- Added `useEffect` that resets `loaded` and `error` to `false` whenever `src` changes. Previously, if a parent reused the same component instance with a different URL (e.g. a stale layout before AnimatePresence unmounts), the image from the old source would flash as "loaded". The reset ensures the shimmer always appears for each new image.
- Vignette is now always rendered (removed the `{loaded && ...}` condition). It appears immediately and acts as a permanent visual separator between the image and card body, rather than popping in on load.
- Added `vignetteColor?: string` prop (default `#1a1714`) so callers outside the card context can blend the gradient into a different background (e.g. `#0f0e0d` for the ending screen).
- Empty `src` is now treated as a missing state (renders the "No image" fallback immediately rather than showing an `<img>` with an empty `src`).

**`src/engine/imagePreloader.ts`**
- Added `preloadStoryPath(story, choicePath)`: silently runs `replayPath` to enumerate every event and consequence image reachable through the recorded path, then calls `preloadImages` on all of them. This warms the browser cache for the entire replay before a single animated card is shown.
- No new external dependencies — reuses the existing `replayPath` function and `preloadImages`.

**`src/components/Carousel/PastCard.tsx`**
- Replaced the raw `<img>` (with `loading="lazy"`) with `ImageWithShimmer`. Past card images are already preloaded from previous play but may not be in cache on a resumed session; the shimmer provides graceful loading. The shimmer inherits the container's `filter: saturate(0.35)` / `opacity: 0.45`, so it remains visually consistent with the faded past-card style.

**`src/components/GameScreen.tsx`**
- Ending screen: replaced raw `<img>` with `ImageWithShimmer` (`vignetteColor="#0f0e0d"` to blend into the page background). The ending image now shows a shimmer while loading and a fallback if the URL fails.

**`src/App.tsx`**
- Imports `preloadStoryPath` and calls it inside the lazy `useState` initializer immediately after parsing a `?path=` URL. All images for the entire replay are queued for background download before the first render, so by the time the animated replay reaches each card the images are already in cache.

---

## Phase 6 — URL Sharing & Replay
**Goal:** Share a link that animates the full play-through; Skip button to fast-forward; save-to-slot after replay.

### Commit: `(pending)` — Phase 6: URL sharing, animated replay, and replay overlay

**`src/store/gameStore.ts`**
- `startGame` now accepts `slotId: 1 | 2 | 3 | null` (null used for replay — no slot assigned yet).
- Added `loadGameState(data)` action: replaces `currentEventId`, `storyState`, `history`, `choicePath` while resetting `cardPhase` and `pendingOutcome`. Used by the Skip button to fast-forward silently.
- Added `setActiveSaveSlot(slotId)` action: assigns a save slot after the replay completes.

**`src/hooks/useReplay.ts`**
- New hook that drives the game engine step-by-step through a recorded `choicePath[]`.
- Internal state machine with three phases: `selecting` → `confirming` → back to `selecting`.
  - `selecting`: auto-advances narrative events (700 ms delay); auto-selects the next recorded choice on choice events (900 ms delay); transitions to `confirming` after `selectChoice`.
  - `confirming`: waits for `cardPhase === 'back'` (flip complete), then auto-calls `confirmConsequence` (1200 ms delay), increments step, returns to `selecting`.
  - Post-path drain: after all choices are consumed, continues auto-advancing narrative events; transitions to `done` at the next choice or ending event.
- `skip()`: calls `replayPath` to silently reconstruct full game state, then calls `game.loadGameState` and jumps directly to `done`.
- Actions are accessed via a stable `actionsRef` to avoid stale closures without adding them to the effect dep array.
- Returns `{ isDone, currentStep, totalSteps, skip }`.

**`src/components/ReplayOverlay.tsx`**
- Renders over the game screen in two layers:
  - Top bar (always visible): "Replaying shared story… N/M" label + "Skip →" button; changes to "Replay complete" when done.
  - An invisible `pointer-events-auto` overlay during active replay prevents the player from interacting with the cards underneath.
  - Completion panel (animated in from bottom when `isDone`): "You've caught up" heading + 3 save-slot buttons (each shows slot status) + "Return to title without saving" link.
- Reads slot status from `useSavesStore` to display names and fill state.

**`src/components/EventCard/CardFront.tsx`**
- Added optional `highlightedChoiceId?: string` prop. When set, that choice button receives the selected highlight style (`bg-[#3d2e1a] border-[#a07820] text-[#f0d88a]`), letting the replay overlay visually show which choice is being made before the flip.

**`src/components/EventCard/EventCard.tsx`**
- Added optional `disabled?: boolean` prop; passed through to `CardFront` (combined with existing `cardPhase === 'flipping'` disable).
- Passes `highlightedChoiceId={cardPhase === 'flipping' ? pendingOutcome?.choiceId : undefined}` to `CardFront`, so the replay-selected choice lights up during the flip animation.

**`src/components/GameScreen.tsx`**
- New props: `replayChoicePath?: string[]` and `onReplaySaved?: (slotId) => void`.
- Uses `useReplay` when `replayChoicePath` is non-empty; passes engine actions in.
- Renders `<ReplayOverlay>` when in replay mode.
- Passes `disabled={isReplayMode && !replay.isDone}` to `EventCard` to block interaction during active replay.
- Share button (share icon, top-right): builds `?path=choicePath.join(',')` URL, copies to clipboard, shows a "Link copied!" toast (2 s). Visible only when not in replay mode and `choicePath.length > 0`.
- Menu/hamburger button and share button are hidden during active replay; re-appear after replay completes.
- `handleReplaySaved(slotId)`: calls `setActiveSaveSlot`, saves current replayed state to the chosen slot via `savesStore.saveToSlot`, then calls `onReplaySaved` to exit replay mode in App.

**`src/App.tsx`**
- `consumeReplayPath()`: reads `?path=` query param on load, immediately cleans the URL via `window.history.replaceState`, and returns the parsed choice array. Runs once.
- Lazy `useState` init: if a replay path is found, calls `useGameStore.getState().startGame(startEventId, initialState, null)` synchronously to reset game to the story start before first render.
- `isReplay` state: true when a `?path=` URL was opened; set to false after replay is saved or user returns to title.
- `screen` init: `replayChoicePath.length > 0` forces `'game'` regardless of any persisted `currentEventId`.
- Passes `replayChoicePath={isReplay ? replayChoicePath : []}` and `onReplaySaved={handleReplaySaved}` to `GameScreen`.
- `newGameSlotId` is forced to `null` when `isReplay` so `GameScreen` doesn't call `startNewGame` on mount.

---

## Phase 5 — Title Screen & Save Slots
**Goal:** Title screen with 3 save slots, screen routing, return-to-title flow.

### Commit: `(pending)` — Phase 5: title screen, save slots, screen routing

**`src/components/TitleScreen/SaveSlotCard.tsx`**
- Three states: empty (New Game button), filled (Resume + Delete buttons), confirming-delete (inline Cancel/Delete confirmation — no modal needed).
- `formatRelativeTime` renders human-friendly timestamps ("just now", "5m ago", "3h ago", "2d ago", or locale date).
- Filled slot shows: last event text (2-line clamp), event count, relative save time.
- Delete button styled in muted red; destructive action requires inline confirmation before firing.

**`src/components/TitleScreen/TitleScreen.tsx`**
- Cover image (38vh, bottom-edge vignette), story title + author, staggered entrance animations (cover 0s, title 0.15s delay, slots 0.28s delay).
- Receives `onNewGame(slotId)` and `onResume(slotId)` callbacks; delegates delete to `useSavesStore` directly.
- Fully scrollable for small screens.

**`src/App.tsx`**
- Screen routing: `'title' | 'game'` state, initialised from `currentEventId` so in-progress games resume directly without showing the title screen.
- `handleNewGame(slotId)`: sets `newGameSlotId`, navigates to game.
- `handleResume(slotId)`: calls `loadFromSave` on the store, navigates to game.
- `handleReturnToTitle`: calls `resetGame()` (clears runtime state; save data in `savesStore` is unaffected), navigates to title.
- `AnimatePresence mode="wait"` with opacity fade (0.3s) between title and game.

**`src/components/GameScreen.tsx`**
- Removed Phase 3/4 auto-start. Now receives `newGameSlotId: 1 | 2 | 3 | null` prop; calls `engine.startNewGame(newGameSlotId)` on mount only if not null (resume path leaves store untouched).
- Added `onReturnToTitle` prop wired to a minimal hamburger SVG button (top-right, `z-20`).
- Ending screen "Play Again" button now calls `onReturnToTitle` instead of `startNewGame`, returning the player to the save slot selector.

---

## Phase 4 — Carousel
**Goal:** Horizontal scrollable carousel showing past event cards alongside the active card.

### Commit: `(pending)` — Phase 4: carousel with past cards and auto-scroll

**`src/components/Carousel/PastCard.tsx`**
- Read-only card showing a past event: event image (top 45%), truncated story text (4-line clamp), and the choice label the player made (↳ label, italic, truncated).
- Sized at ~58% of the active card: `clamp(130px, 46vw, 215px)` × `clamp(185px, 42vh, 370px)`.
- Visually distinct from active: `opacity: 0.45`, `filter: saturate(0.35)`, `pointer-events: none`, `user-select: none`.

**`src/components/Carousel/Carousel.tsx`**
- Horizontally scrollable flex row: past cards on the left, active card slot on the right.
- `useLayoutEffect` jumps instantly to the end on mount — ensures the active card is always visible when the game loads or a save is resumed, with no visible scroll.
- `useEffect` watching `history.length` triggers a smooth scroll to the end 80ms after a new card is added (delay lets the past card entrance animation start first).
- `AnimatePresence initial={false}` on past cards: existing history loaded from a save renders without animation; only newly appended entries animate in (`opacity 0→1`, `x 24→0`, `scale 0.92→1`, 0.28s).
- Accepts `children` for the active card slot, keeping card advance animation logic in `GameScreen`.

**`src/components/GameScreen.tsx`**
- Replaced centered `AnimatePresence` layout with `<Carousel history={engine.history}>`.
- Active `EventCard` + its `AnimatePresence` (card advance slide) passed as children to `Carousel`.
- Card advance exit animation tightened: `x: -60` (was -80), `duration: 0.22` (was 0.24) to feel snappier alongside the past card appearing.

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
