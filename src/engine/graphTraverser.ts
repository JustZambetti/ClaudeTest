import type { ChoiceEvent, StoryState, Outcome } from '../types/story';
import type { ResolvedOutcome } from '../store/gameStore';
import { evaluateCondition } from './conditionEvaluator';

/**
 * Given a choice ID and current state, find the first outcome whose
 * condition matches and return it. Returns null if the choice ID is
 * not found or no outcome matches (should not happen if story is
 * authored correctly with a null-condition fallback).
 */
export function resolveOutcome(
  event: ChoiceEvent,
  choiceId: string,
  state: StoryState
): ResolvedOutcome | null {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    console.warn(`[graphTraverser] Choice "${choiceId}" not found on event "${event.id}"`);
    return null;
  }

  const outcome: Outcome | undefined = choice.outcomes.find((o) =>
    evaluateCondition(o.condition, state)
  );

  if (!outcome) {
    console.warn(
      `[graphTraverser] No matching outcome for choice "${choiceId}" on event "${event.id}". ` +
      'Ensure the last outcome has condition: null.'
    );
    return null;
  }

  return {
    consequenceText: outcome.consequence.text,
    consequenceImage: outcome.consequence.image,
    nextEventId: outcome.nextEventId,
  };
}

/** Return the stateChanges from the matching outcome (needed to apply before routing). */
export function resolveOutcomeChanges(
  event: ChoiceEvent,
  choiceId: string,
  state: StoryState
): Record<string, number | boolean | string> {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return {};

  const outcome = choice.outcomes.find((o) => evaluateCondition(o.condition, state));
  return outcome?.consequence.stateChanges ?? {};
}
