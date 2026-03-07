# Interactive Story Web App — Design Plan

---

## 1. Overview

A static, mobile-first web application presenting an interactive narrative through a Reigns-style card interface. The user makes choices that mutate a hidden global state, advancing through a directed graph of events. Consequences and next events are state-dependent. Progress is auto-saved after every event across 3 save slots. Stories are shareable via URL, which triggers an animated replay.

---

## 2. Story Architecture

### 2.1 Structure: Directed Graph

Stories are **directed graphs**:
- Nodes are **events** — each has an image, text, and zero or more choices
- Edges are **outcomes** — the result of making a choice, gated by state conditions
- An event can be reached from multiple other nodes (converging paths, loops)
- The player never sees the state — it silently shapes consequences and routing

### 2.2 Event Types

Events are distinguished by their `choices` field:

| Type | `choices` | `nextEventId` | Behavior |
|---|---|---|---|
| **Choice event** | 2+ items | — | Shows choice buttons; outcome determines next event |
| **Narrative event** | empty / absent | required | No choices; shows a single "Continue" button; advances to `nextEventId` |
| **Ending event** | empty / absent | absent | Terminal node; shows the ending screen |

This covers all cases:
- Mid-story cutscenes and transitions → Narrative event
- Epilogue sequences after a final choice → chain of Narrative events → Ending event
- Standard branching moments → Choice event
- A choice that leads to an epilogue → Choice event → Narrative event(s) → Ending event

### 2.3 Core Design Principle: State-Driven Outcomes

State does **not** affect which choices appear — all choices are always visible.
State **does** affect:
- Which **consequence** text and image is shown after a choice (choice events only)
- Which **next event** the player is routed to (choice events only)

Every choice has an ordered list of **outcome branches**. The engine evaluates each branch's condition top-to-bottom and picks the first match. The last branch always has `condition: null` as the unconditional fallback.

```
Player taps a choice button
  → engine checks outcome branches top-to-bottom against current state
  → first matching branch fires:
      - card flips to show consequence text + image
      - stateChanges applied (with clamping)
      - nextEventId recorded
  → player taps Continue
      - auto-save triggers
      - next event loads
```

For narrative events:
```
Engine auto-detects no choices
  → card shows text + image + single Continue button (no flip)
  → player taps Continue
      - auto-save triggers
      - advances to nextEventId (or ending if absent)
```

---

### 2.4 Story Format

**JSON with JSONLogic-style condition objects**

- No `eval()` — pure tree-walking evaluator, safe and testable
- Human-readable, machine-writable, diffable
- Easy to validate with a JSON Schema

---

### 2.5 Full Data Schema

#### `story.json` top-level

```json
{
  "meta": {
    "id": "the_lost_heir",
    "title": "The Lost Heir",
    "version": "1.0",
    "startEventId": "intro",
    "author": "...",
    "coverImage": "https://..."
  },
  "initialState": {
    "suspicion": { "value": 0,  "min": 0, "max": 100 },
    "trust":     { "value": 50, "min": 0, "max": 100 },
    "gold":      { "value": 20, "min": 0, "max": null },
    "hasKey":    { "value": false }
  },
  "events": { ... }
}
```

**State variable rules:**
- `value`: initial value (number | boolean | string)
- `min` / `max`: clamping bounds after every delta; `null` = unclamped; only applies to numeric types
- State is never shown to the player

---

#### Choice event (standard branching)

```json
"event_crossroads": {
  "id": "event_crossroads",
  "image": "https://example.com/forest_path.jpg",
  "text": "A hooded stranger watches you from the shadows.",
  "choices": [
    {
      "id": "choice_approach",
      "label": "Approach the stranger",
      "outcomes": [
        {
          "condition": { ">": ["$suspicion", 60] },
          "consequence": {
            "text": "He lunges at you. You barely escape.",
            "image": "https://example.com/ambush.jpg",
            "stateChanges": { "trust": -20, "suspicion": 10 }
          },
          "nextEventId": "event_injured_escape"
        },
        {
          "condition": null,
          "consequence": {
            "text": "He smiles and offers directions to the village.",
            "image": "https://example.com/stranger_friendly.jpg",
            "stateChanges": { "trust": 15 }
          },
          "nextEventId": "event_village_entrance"
        }
      ]
    },
    {
      "id": "choice_avoid",
      "label": "Slip past unnoticed",
      "outcomes": [
        {
          "condition": null,
          "consequence": {
            "text": "You sidle past, eyes low. You feel watched long after.",
            "image": "https://example.com/sneaking.jpg",
            "stateChanges": { "suspicion": 5 }
          },
          "nextEventId": "event_village_entrance"
        }
      ]
    }
  ]
}
```

#### Narrative event (no choices, just Continue)

```json
"event_village_arrival": {
  "id": "event_village_arrival",
  "image": "https://example.com/village.jpg",
  "text": "The village emerges through the mist. Smoke curls from chimneys. A bell tolls once.",
  "nextEventId": "event_inn_entrance"
}
```

#### Ending event (terminal node)

```json
"ending_exile": {
  "id": "ending_exile",
  "image": "https://example.com/exile_road.jpg",
  "text": "You leave the kingdom forever. The gates close behind you with a hollow clang.",
  "endingTitle": "The Road of Exile"
}
```

The presence of `endingTitle` (or absence of both `choices` and `nextEventId`) signals a terminal node. The engine renders the ending screen instead of a Continue button.

---

#### Condition operators

| Expression | Meaning |
|---|---|
| `{ ">":  ["$x", 5] }` | state.x > 5 |
| `{ ">=": ["$x", 5] }` | state.x >= 5 |
| `{ "<":  ["$x", 5] }` | state.x < 5 |
| `{ "<=": ["$x", 5] }` | state.x <= 5 |
| `{ "==": ["$x", true] }` | strict equality |
| `{ "!=": ["$x", false] }` | strict inequality |
| `{ "and": [cond1, cond2] }` | both true |
| `{ "or":  [cond1, cond2] }` | either true |
| `{ "not": cond }` | negation |

Operands: state ref (`"$varName"`), number, boolean, or string literal.

#### State change syntax

```json
"stateChanges": {
  "suspicion": 10,    // numeric delta — clamped to [min, max] after
  "gold": -5,         // will not go below min=0
  "hasKey": true,     // boolean/string — direct set
  "trust": -20        // clamped to min=0
}
```

Numbers are always **deltas**. Booleans and strings are always **direct sets**. Clamping is automatic.

---

## 3. App Architecture

### 3.1 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React + Vite | `vite build` produces a fully static bundle |
| Styling | Tailwind CSS | Mobile-first, dark theme, no runtime CSS |
| Animation | Framer Motion | Card flip, carousel slide, replay sequencing |
| Gestures | `@use-gesture/react` | Touch swipe on carousel |
| State | Zustand | Minimal boilerplate, easy `localStorage` persist |
| Persistence | Zustand `persist` middleware | Auto-sync to localStorage |
| URL sharing | `URLSearchParams` | Encode choice path in query string |
| Story data | `/public/story.json` | Fetched once at app load; single story |
| Images | `new Image()` preload | Background preload of next-step images |
| Hosting | Netlify / Vercel / GitHub Pages | Any static host |

### 3.2 Source Structure

```
src/
  engine/
    conditionEvaluator.ts   // pure fn: evaluate JSONLogic condition against state object
    stateManager.ts         // apply stateChanges delta with clamping
    graphTraverser.ts       // given choice + state → resolve outcome branch
    imagePreloader.ts       // preload images for all reachable next events
    pathReplayer.ts         // replay choice-id sequence → reconstruct full game state
  store/
    gameStore.ts            // runtime state: currentEventId, storyState, history, cardPhase
    savesStore.ts           // 3 save slots in localStorage
  components/
    TitleScreen/
      TitleScreen.tsx       // title + 3 save slot cards
      SaveSlot.tsx          // empty ("New Game") or filled (resume / delete)
    EventCard/
      EventCard.tsx         // orchestrates flip; switches between front and back
      CardFront.tsx         // event image, text, choice buttons (or Continue for narrative)
      CardBack.tsx          // consequence image, consequence text, Continue button
    Carousel/
      Carousel.tsx          // horizontal scroll container
      PastCard.tsx          // read-only past card, faded + scaled down
    ReplayOverlay.tsx       // animated story replay; drives cards automatically; Skip button
    EndingScreen.tsx        // ending title, text, image; replay + share + return to title
  hooks/
    useStoryEngine.ts       // choice → outcome → state update → auto-save → next event
    useReplay.ts            // drives replay animation step by step
  types/
    story.ts                // TypeScript types for the full JSON schema
  App.tsx
public/
  story.json                // the single story file
```

---

## 4. State & Saves

### 4.1 Runtime Game State (Zustand `gameStore`)

```ts
type CardPhase = 'front' | 'flipping' | 'back';

interface ResolvedOutcome {
  consequenceText: string;
  consequenceImage: string;
  nextEventId: string | null;
}

interface HistoryEntry {
  eventId: string;
  eventImage: string;
  eventText: string;
  // For choice events:
  choiceId?: string;
  choiceLabel?: string;
  consequenceText?: string;
  consequenceImage?: string;
}

interface GameState {
  currentEventId: string;
  cardPhase: CardPhase;
  pendingOutcome: ResolvedOutcome | null;
  storyState: Record<string, number | boolean | string>;
  history: HistoryEntry[];
  choicePath: string[];            // ordered choice IDs — used for URL encoding
  activeSaveSlot: 1 | 2 | 3 | null;

  // Actions
  selectChoice: (choiceId: string) => void;
  confirmConsequence: () => void;
  continueNarrative: () => void;
  loadFromSave: (slot: SaveSlot) => void;
  reset: () => void;
}
```

### 4.2 Save Slots (Zustand `savesStore`, persisted to localStorage)

```ts
interface SaveSlot {
  slotId: 1 | 2 | 3;
  isEmpty: boolean;
  savedAt: string;                  // ISO timestamp
  eventCount: number;               // history length — shown as progress indicator
  lastEventText: string;            // first ~60 chars of current event, shown in slot card
  currentEventId: string;
  storyState: Record<string, number | boolean | string>;
  history: HistoryEntry[];
  choicePath: string[];
}
```

### 4.3 Auto-Save Behavior

Auto-save fires after every event advance (after Continue is tapped and the new event loads):
- If `activeSaveSlot` is set, overwrite that slot silently
- If no slot is active (new game just started), prompt the player once to pick a slot
- Slot card in the title screen updates immediately

---

## 5. Title Screen & Save Slots UI

```
+------------------------------------+
|  [cover image, full-width]         |
|                                    |
|        THE LOST HEIR               |
|                                    |
|  +------ SAVE 1 ----------------+  |
|  |  "A hooded stranger watches…" |  |
|  |  12 events  ·  2 hours ago   |  |
|  |  [Resume]          [Delete]  |  |
|  +--------------------------------+ |
|                                    |
|  +------ SAVE 2 ----------------+  |
|  |  (empty)                     |  |
|  |  [New Game]                  |  |
|  +--------------------------------+ |
|                                    |
|  +------ SAVE 3 ----------------+  |
|  |  (empty)                     |  |
|  |  [New Game]                  |  |
|  +--------------------------------+ |
+------------------------------------+
```

- Filled slot shows: last event text snippet, event count, relative time
- Resuming a filled slot loads full history + state + positions carousel at last card
- Starting a New Game on a filled slot shows a confirmation dialog before overwriting

---

## 6. URL Sharing & Animated Replay

### 6.1 URL Format

```
https://myapp.com/?path=choice_approach,choice_trust,choice_fight
```

`path` = comma-separated choice IDs in order (choice events only; narrative events are skipped since they have no choice ID).

### 6.2 Replay Flow

```
App detects ?path param on load
  → load story.json
  → show ReplayOverlay ("Watching a story…" + Skip button)
  → animate each step:
       show event front (brief pause)
       → highlight the recorded choice
       → flip card to consequence
       → brief pause
       → slide to next event
  → on completion:
       dismiss ReplayOverlay
       full history visible in carousel
       player is on the same event the sharer was on
       prompt: "Continue from here?" (pick a save slot) | "Start fresh"
```

### 6.3 Skip Button

- Single "Skip" button in the ReplayOverlay header
- Tapping Skip: runs `pathReplayer.ts` silently (no animation), reconstructs full state instantly, dismisses overlay, shows the same end state
- No per-card skip; all-or-nothing

---

## 7. UI / UX (Reigns-Inspired)

### 7.1 Visual Language

| Element | Style |
|---|---|
| Background | Near-black `#0f0e0d` + subtle CSS noise grain overlay |
| Cards | Dark warm parchment (`#1a1714`), amber/gold border `1px`, `border-radius: 16px`, deep drop shadow |
| Event image | Top ~45% of card, full bleed, bottom-edge gradient fade into card body |
| Story text | *EB Garamond* or *Crimson Pro* serif, off-white `#e8e0d0`, `font-size: 1.05rem`, generous `line-height: 1.7` |
| Choice buttons | Side-by-side, full half-width; stone/leather texture; serif label; no icons |
| Consequence text | Italic, slightly dimmer tint; back face has a faint warm glow behind text |
| Continue button | Single centered button, same style as choice buttons |
| Narrative Continue | Identical to consequence Continue — single centered button on front face |
| Past cards | 60% scale, 40% opacity, `filter: saturate(0.3)`, no pointer events |
| Active card | 100% scale, full color, centered with spring entrance |

### 7.2 Mobile Layout (390px reference)

```
+-------------------------------------------+
| [≡ menu]                   [↑ share]       |  <- top bar, minimal
+-------------------------------------------+
|                                            |
|  [past][past][ ACTIVE CARD               ]|
|              +---------------------------+ |
|              |  ~~~~~~~~~~~~~~~~~~~~~~~~ | |  <- shimmer or image
|              |  ~~~~~~~~~~~~~~~~~~~~~~~~ | |
|              |  Story text here, two or  | |
|              |  three lines of serif...  | |
|              |                           | |
|              | [Choice A]  | [Choice B]  | |
|              +---------------------------+ |
|                                            |
+-------------------------------------------+
```

- Active card: `88vw` wide, `72vh` tall
- Carousel scrollable horizontally via swipe; snaps back to active card when released
- No state display anywhere in UI
- Menu button: save slot indicator (which slot is active), return to title
- Share button: copies current URL with `?path=...` to clipboard; shows a brief toast

### 7.3 Card Interactions

**Choice event — front face:**
1. Player taps a choice button → button pulses, flip begins
2. Card rotates 90° on Y-axis (front disappears)
3. Back face fades in: consequence image loads, text slides up
4. "Continue →" button appears after text settles
5. Player taps Continue → auto-save fires; card shrinks + slides left into carousel; new card springs in from right

**Narrative event — front face:**
1. No choice buttons — single centered "Continue →" button
2. Player taps Continue → no flip; card transitions directly left into carousel; new card springs in

**Ending event:**
1. No Continue button
2. After a brief pause, ending screen overlays: large ending title, text, image
3. Buttons: "Play Again" (title screen), "Share" (URL with full path)

---

## 8. Image Preloading

```ts
// Called when an event is displayed
function preloadAhead(event: StoryEvent, state: StoryState, events: EventMap) {
  if (event.choices) {
    // Choice event: preload all possible consequence images + all possible next event images
    event.choices.forEach(choice => {
      choice.outcomes.forEach(outcome => {
        preload(outcome.consequence.image);
        const next = events[outcome.nextEventId];
        if (next) preload(next.image);
      });
    });
  } else if (event.nextEventId) {
    // Narrative event: preload the single next event image
    const next = events[event.nextEventId];
    if (next) preload(next.image);
  }
}

// Called immediately when player taps a choice (before flip animation ends)
function preloadConsequence(outcome: ResolvedOutcome) {
  preload(outcome.consequence.image);
}
```

- `preload(url)` uses `new Image().src = url`
- Image areas show a shimmer skeleton (`animate-pulse` in Tailwind) until loaded
- Broken URLs fall back to a placeholder illustration

---

## 9. Development Phases

### Phase 1 — Foundation
- [ ] Vite + React + TypeScript + Tailwind + Framer Motion setup
- [ ] TypeScript types for full story schema (`src/types/story.ts`)
- [ ] Zustand `gameStore` + `savesStore` with localStorage persist
- [ ] `/public/story.json` with sample story (15 events, narrative events, epilogue chain, 3 endings)

### Phase 2 — Story Engine (fully unit-tested)
- [ ] `conditionEvaluator.ts` — full operator set
- [ ] `stateManager.ts` — delta application + clamping
- [ ] `graphTraverser.ts` — resolve outcome branch; detect narrative/ending events
- [ ] `useStoryEngine.ts` — wires engine to store; handles all 3 event types

### Phase 3 — Core Card UI
- [ ] `EventCard` + Framer Motion Y-axis flip
- [ ] `CardFront` — choice event variant (image + text + 2 buttons) + narrative variant (image + text + 1 button)
- [ ] `CardBack` — consequence image + text + Continue
- [ ] Shimmer skeleton for image loading states
- [ ] Broken image fallback

### Phase 4 — Carousel
- [ ] `Carousel` with `@use-gesture/react` horizontal swipe
- [ ] `PastCard` — faded, scaled, read-only
- [ ] Snap-to-active on gesture release
- [ ] History reconstructed correctly when loading a save

### Phase 5 — Title Screen & Save Slots
- [ ] `savesStore` CRUD (create, read, overwrite, delete)
- [ ] `TitleScreen` layout
- [ ] `SaveSlot` component: empty + filled states
- [ ] Auto-save hook in `useStoryEngine` (fires on every event advance)
- [ ] Slot-picker prompt for first event of a new game

### Phase 6 — URL Sharing & Replay
- [ ] `pathReplayer.ts` — silent state reconstruction from choice array
- [ ] `useReplay.ts` — animated step driver
- [ ] `ReplayOverlay` — auto-advancing cards + Skip button
- [ ] Post-replay prompt (Continue / Start fresh)
- [ ] Share button with clipboard + toast

### Phase 7 — Image Preloading
- [ ] `imagePreloader.ts` — lookahead preload on event display
- [ ] Consequence preload on choice tap
- [ ] Shimmer skeleton + broken URL fallback

### Phase 8 — Polish & Demo Content
- [ ] Full Reigns visual theme (textures, fonts, animations tuned)
- [ ] `EndingScreen` component
- [ ] Accessibility: ARIA roles, focus management, keyboard nav
- [ ] Deploy to static host
- [ ] Author a complete demo story (30+ events, meaningful state, epilogue sequences)
