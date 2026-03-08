import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoryState, HistoryEntry } from '../types/story';
import type { SaveSlot } from './savesStore';

export type CardPhase = 'front' | 'flipping' | 'back';

/** Full pending outcome stored while the card back face is visible. */
export interface ResolvedOutcome {
  choiceId: string;
  choiceLabel: string;
  consequenceText: string;
  consequenceImage: string;
  nextEventId: string;
}

interface GameState {
  currentEventId: string;
  cardPhase: CardPhase;
  pendingOutcome: ResolvedOutcome | null;

  storyState: StoryState;

  history: HistoryEntry[];
  choicePath: string[];

  activeSaveSlot: 1 | 2 | 3 | null;

  startGame: (startEventId: string, initialState: StoryState, slotId: 1 | 2 | 3 | null) => void;
  setCardPhase: (phase: CardPhase) => void;
  setPendingOutcome: (outcome: ResolvedOutcome | null) => void;
  confirmConsequence: (nextEventId: string, entry: HistoryEntry, newState: StoryState, choiceId: string) => void;
  continueNarrative: (nextEventId: string, entry: HistoryEntry) => void;
  loadFromSave: (slot: SaveSlot) => void;
  loadGameState: (data: { currentEventId: string; storyState: StoryState; history: HistoryEntry[]; choicePath: string[] }) => void;
  setActiveSaveSlot: (slotId: 1 | 2 | 3) => void;
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
          cardPhase: 'front' as CardPhase,
          pendingOutcome: null,
          storyState: newState,
          history: [...s.history, entry],
          choicePath: [...s.choicePath, choiceId],
        })),

      continueNarrative: (nextEventId, entry) =>
        set((s) => ({
          currentEventId: nextEventId,
          cardPhase: 'front' as CardPhase,
          history: [...s.history, entry],
        })),

      loadFromSave: (slot) =>
        set({
          currentEventId: slot.currentEventId,
          cardPhase: 'front',
          pendingOutcome: null,
          storyState: slot.storyState,
          history: slot.history,
          choicePath: slot.choicePath,
          activeSaveSlot: slot.slotId,
        }),

      loadGameState: (data) =>
        set({
          currentEventId: data.currentEventId,
          cardPhase: 'front',
          pendingOutcome: null,
          storyState: data.storyState,
          history: data.history,
          choicePath: data.choicePath,
        }),

      setActiveSaveSlot: (slotId) => set({ activeSaveSlot: slotId }),

      resetGame: () => set(initialGameState),
    }),
    {
      name: 'interactive-story-game',
    }
  )
);
