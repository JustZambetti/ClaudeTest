import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoryState, HistoryEntry } from '../types/story';

export type CardPhase = 'front' | 'flipping' | 'back';

export interface ResolvedOutcome {
  consequenceText: string;
  consequenceImage: string;
  nextEventId: string;
}

interface GameState {
  // Progress
  currentEventId: string;
  cardPhase: CardPhase;
  pendingOutcome: ResolvedOutcome | null;

  // Story state (hidden from player)
  storyState: StoryState;

  // History for carousel + URL sharing
  history: HistoryEntry[];
  choicePath: string[];

  // Active save slot (null until player picks one on new game)
  activeSaveSlot: 1 | 2 | 3 | null;

  // Actions
  startGame: (startEventId: string, initialState: StoryState, slotId: 1 | 2 | 3) => void;
  setCardPhase: (phase: CardPhase) => void;
  setPendingOutcome: (outcome: ResolvedOutcome | null) => void;
  confirmConsequence: (nextEventId: string, entry: HistoryEntry, newState: StoryState, choiceId: string) => void;
  continueNarrative: (nextEventId: string, entry: HistoryEntry) => void;
  resetGame: () => void;
}

const initialGameState = {
  currentEventId: '',
  cardPhase: 'front' as CardPhase,
  pendingOutcome: null,
  storyState: {},
  history: [],
  choicePath: [],
  activeSaveSlot: null as 1 | 2 | 3 | null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialGameState,

      startGame: (startEventId, initialState, slotId) =>
        set({
          currentEventId: startEventId,
          cardPhase: 'front',
          pendingOutcome: null,
          storyState: initialState,
          history: [],
          choicePath: [],
          activeSaveSlot: slotId,
        }),

      setCardPhase: (phase) => set({ cardPhase: phase }),

      setPendingOutcome: (outcome) => set({ pendingOutcome: outcome }),

      confirmConsequence: (nextEventId, entry, newState, choiceId) =>
        set((s) => ({
          currentEventId: nextEventId,
          cardPhase: 'front',
          pendingOutcome: null,
          storyState: newState,
          history: [...s.history, entry],
          choicePath: [...s.choicePath, choiceId],
        })),

      continueNarrative: (nextEventId, entry) =>
        set((s) => ({
          currentEventId: nextEventId,
          cardPhase: 'front',
          history: [...s.history, entry],
        })),

      resetGame: () => set(initialGameState),
    }),
    {
      name: 'interactive-story-game',
    }
  )
);
