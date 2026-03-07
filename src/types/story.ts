// ---------------------------------------------------------------------------
// Condition expressions (JSONLogic-style, no eval)
// ---------------------------------------------------------------------------

export type StateRef = `$${string}`;
export type ConditionOperand = StateRef | number | boolean | string;

export type Condition =
  | { '>':   [ConditionOperand, ConditionOperand] }
  | { '>=':  [ConditionOperand, ConditionOperand] }
  | { '<':   [ConditionOperand, ConditionOperand] }
  | { '<=':  [ConditionOperand, ConditionOperand] }
  | { '==':  [ConditionOperand, ConditionOperand] }
  | { '!=':  [ConditionOperand, ConditionOperand] }
  | { 'and': [Condition, Condition, ...Condition[]] }
  | { 'or':  [Condition, Condition, ...Condition[]] }
  | { 'not': Condition };

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type StateValue = number | boolean | string;

export interface NumericStateVar {
  value: number;
  min: number | null;
  max: number | null;
}

export interface ScalarStateVar {
  value: boolean | string;
}

export type StateVarDef = NumericStateVar | ScalarStateVar;

export type InitialState = Record<string, StateVarDef>;

export type StoryState = Record<string, StateValue>;

/** Delta object applied after a choice outcome fires.
 *  Numbers are deltas (added to current value, then clamped).
 *  Booleans and strings are direct sets.
 */
export type StateChanges = Record<string, StateValue>;

// ---------------------------------------------------------------------------
// Outcomes (inside a choice)
// ---------------------------------------------------------------------------

export interface Consequence {
  text: string;
  image: string;
  stateChanges?: StateChanges;
}

export interface Outcome {
  /** null = unconditional fallback (must be last in array) */
  condition: Condition | null;
  consequence: Consequence;
  nextEventId: string;
}

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

export interface Choice {
  id: string;
  label: string;
  outcomes: [Outcome, ...Outcome[]]; // at least one outcome required
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

interface BaseEvent {
  id: string;
  image: string;
  text: string;
}

/** Standard branching event — shows choice buttons */
export interface ChoiceEvent extends BaseEvent {
  choices: [Choice, Choice, ...Choice[]]; // at least 2 choices
}

/** Narrative event — no choices, single Continue button */
export interface NarrativeEvent extends BaseEvent {
  nextEventId: string;
}

/** Terminal ending event — no choices, no nextEventId */
export interface EndingEvent extends BaseEvent {
  endingTitle: string;
}

export type StoryEvent = ChoiceEvent | NarrativeEvent | EndingEvent;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isChoiceEvent(e: StoryEvent): e is ChoiceEvent {
  return 'choices' in e && Array.isArray((e as ChoiceEvent).choices);
}

export function isNarrativeEvent(e: StoryEvent): e is NarrativeEvent {
  return 'nextEventId' in e && !('choices' in e);
}

export function isEndingEvent(e: StoryEvent): e is EndingEvent {
  return 'endingTitle' in e;
}

// ---------------------------------------------------------------------------
// Story root
// ---------------------------------------------------------------------------

export interface StoryMeta {
  id: string;
  title: string;
  version: string;
  startEventId: string;
  author?: string;
  coverImage?: string;
}

export interface Story {
  meta: StoryMeta;
  initialState: InitialState;
  events: Record<string, StoryEvent>;
}

// ---------------------------------------------------------------------------
// Runtime history
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  eventId: string;
  eventImage: string;
  eventText: string;
  // Populated for choice events only:
  choiceId?: string;
  choiceLabel?: string;
  consequenceText?: string;
  consequenceImage?: string;
}
