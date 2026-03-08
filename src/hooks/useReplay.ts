import { useState, useEffect, useRef, useCallback } from 'react';
import type { Story } from '../types/story';
import { isChoiceEvent, isNarrativeEvent, isEndingEvent } from '../types/story';
import { useGameStore } from '../store/gameStore';
import { replayPath } from '../engine/pathReplayer';

const CHOICE_DELAY = 900;   // ms before auto-selecting a choice
const CONFIRM_DELAY = 1200; // ms before auto-confirming the consequence
const NARRATIVE_DELAY = 700; // ms before auto-advancing a narrative event

type Phase = 'selecting' | 'confirming' | 'done';

interface ReplayActions {
  selectChoice: (id: string) => void;
  confirmConsequence: () => void;
  continueNarrative: () => void;
}

/**
 * Drives the game engine step-by-step through a recorded choice path,
 * animating each card flip and consequence at human-readable speed.
 *
 * Pass `isActive = false` to disable all driving (e.g. when replay is not in
 * progress). The hook is completely passive when inactive.
 */
export function useReplay(
  story: Story,
  choicePath: string[],
  isActive: boolean,
  actions: ReplayActions,
) {
  const game = useGameStore();
  const [phase, setPhase] = useState<Phase>('selecting');
  const [step, setStep] = useState(0);

  // Keep a stable ref to actions so the effect dep array stays minimal
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const totalSteps = choicePath.length;

  // ── Skip: silently fast-forward to the end via pathReplayer ───────────────
  const skip = useCallback(() => {
    const result = replayPath(story, choicePath);
    game.loadGameState({
      currentEventId: result.currentEventId,
      storyState: result.storyState,
      history: result.history,
      choicePath,
    });
    setStep(totalSteps);
    setPhase('done');
  }, [story, choicePath, game, totalSteps]);

  // ── Replay driver ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || phase === 'done') return;

    const currentEvent = story.events[game.currentEventId];
    if (!currentEvent) return;

    let t: ReturnType<typeof setTimeout> | undefined;

    if (phase === 'selecting') {
      if (isNarrativeEvent(currentEvent) && game.cardPhase === 'front') {
        // Auto-advance narrative events (before and after all choices)
        t = setTimeout(() => actionsRef.current.continueNarrative(), NARRATIVE_DELAY);
      } else if (isChoiceEvent(currentEvent) && game.cardPhase === 'front') {
        if (step < totalSteps) {
          // Auto-select the next recorded choice
          t = setTimeout(() => {
            actionsRef.current.selectChoice(choicePath[step]);
            setPhase('confirming');
          }, CHOICE_DELAY);
        } else {
          // No more choices — replay complete
          setPhase('done');
        }
      } else if (isEndingEvent(currentEvent)) {
        setPhase('done');
      }
    } else if (phase === 'confirming' && game.cardPhase === 'back') {
      // Card has flipped to back face — auto-confirm the consequence
      t = setTimeout(() => {
        actionsRef.current.confirmConsequence();
        setStep((s) => s + 1);
        setPhase('selecting');
      }, CONFIRM_DELAY);
    }

    return () => { if (t !== undefined) clearTimeout(t); };
  }, [isActive, phase, game.currentEventId, game.cardPhase, step, totalSteps, story, choicePath]);

  return {
    isDone: phase === 'done',
    currentStep: step,
    totalSteps,
    skip,
  };
}
