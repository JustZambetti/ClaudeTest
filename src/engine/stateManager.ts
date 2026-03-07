import type { InitialState, StateChanges, StoryState } from '../types/story';

/** Build a flat StoryState from an InitialState definition. */
export function buildInitialState(initialState: InitialState): StoryState {
  const state: StoryState = {};
  for (const [key, def] of Object.entries(initialState)) {
    state[key] = def.value;
  }
  return state;
}

/** Apply a stateChanges delta to the current state, respecting clamp bounds. */
export function applyStateChanges(
  current: StoryState,
  changes: StateChanges,
  initialState: InitialState
): StoryState {
  const next = { ...current };

  for (const [key, delta] of Object.entries(changes)) {
    const def = initialState[key];
    if (!def) {
      console.warn(`[stateManager] stateChanges references unknown key: "${key}"`);
      continue;
    }

    if (typeof delta === 'number' && typeof next[key] === 'number') {
      let value = (next[key] as number) + delta;
      const numDef = def as { value: number; min: number | null; max: number | null };
      if (numDef.min !== null && numDef.min !== undefined) value = Math.max(numDef.min, value);
      if (numDef.max !== null && numDef.max !== undefined) value = Math.min(numDef.max, value);
      next[key] = value;
    } else {
      // boolean or string: direct set
      next[key] = delta;
    }
  }

  return next;
}
