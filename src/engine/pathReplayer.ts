import type { Story, StoryState, HistoryEntry } from '../types/story';
import { isChoiceEvent, isNarrativeEvent } from '../types/story';
import { buildInitialState, applyStateChanges } from './stateManager';
import { resolveOutcome, resolveOutcomeChanges } from './graphTraverser';

export interface ReplayResult {
  currentEventId: string;
  storyState: StoryState;
  history: HistoryEntry[];
  /** True if replay completed without errors */
  ok: boolean;
}

/**
 * Silently replay an ordered list of choice IDs against a story,
 * returning the final game state. Used for URL sharing reconstruction.
 * Narrative events are traversed automatically (no choice needed).
 */
export function replayPath(story: Story, choicePath: string[]): ReplayResult {
  let currentEventId = story.meta.startEventId;
  let storyState: StoryState = buildInitialState(story.initialState);
  const history: HistoryEntry[] = [];
  const choiceQueue = [...choicePath];

  const MAX_STEPS = 10_000; // guard against infinite loops
  let steps = 0;

  while (steps++ < MAX_STEPS) {
    const event = story.events[currentEventId];
    if (!event) {
      console.warn(`[pathReplayer] Unknown event: "${currentEventId}"`);
      return { currentEventId, storyState, history, ok: false };
    }

    if (isNarrativeEvent(event)) {
      history.push({
        eventId: event.id,
        eventImage: event.image,
        eventText: event.text,
      });
      currentEventId = event.nextEventId;
      continue;
    }

    if (isChoiceEvent(event)) {
      const choiceId = choiceQueue.shift();
      if (choiceId === undefined) {
        // No more choices — we've reached the current live event
        return { currentEventId, storyState, history, ok: true };
      }

      const outcome = resolveOutcome(event, choiceId, storyState);
      if (!outcome) {
        return { currentEventId, storyState, history, ok: false };
      }

      const changes = resolveOutcomeChanges(event, choiceId, storyState);
      storyState = applyStateChanges(storyState, changes, story.initialState);

      const choice = event.choices.find((c) => c.id === choiceId)!;
      history.push({
        eventId: event.id,
        eventImage: event.image,
        eventText: event.text,
        choiceId,
        choiceLabel: choice.label,
        consequenceText: outcome.consequenceText,
        consequenceImage: outcome.consequenceImage,
      });

      currentEventId = outcome.nextEventId;
      continue;
    }

    // Ending event — stop
    return { currentEventId, storyState, history, ok: true };
  }

  console.warn('[pathReplayer] Hit step limit — possible infinite loop in story graph');
  return { currentEventId, storyState, history, ok: false };
}
