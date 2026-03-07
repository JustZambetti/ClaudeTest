import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoryState, HistoryEntry } from '../types/story';

export interface SaveSlot {
  slotId: 1 | 2 | 3;
  isEmpty: boolean;
  savedAt: string;           // ISO timestamp
  eventCount: number;        // history.length — progress indicator
  lastEventText: string;     // first 60 chars of current event text
  currentEventId: string;
  storyState: StoryState;
  history: HistoryEntry[];
  choicePath: string[];      // used for URL sharing
}

const emptySlot = (slotId: 1 | 2 | 3): SaveSlot => ({
  slotId,
  isEmpty: true,
  savedAt: '',
  eventCount: 0,
  lastEventText: '',
  currentEventId: '',
  storyState: {},
  history: [],
  choicePath: [],
});

interface SavesState {
  slots: [SaveSlot, SaveSlot, SaveSlot];

  saveToSlot: (
    slotId: 1 | 2 | 3,
    data: Pick<SaveSlot, 'currentEventId' | 'storyState' | 'history' | 'choicePath' | 'lastEventText'>
  ) => void;

  deleteSlot: (slotId: 1 | 2 | 3) => void;
}

export const useSavesStore = create<SavesState>()(
  persist(
    (set) => ({
      slots: [emptySlot(1), emptySlot(2), emptySlot(3)],

      saveToSlot: (slotId, data) =>
        set((s) => {
          const next = s.slots.map((slot) =>
            slot.slotId === slotId
              ? {
                  ...slot,
                  isEmpty: false,
                  savedAt: new Date().toISOString(),
                  eventCount: data.history.length,
                  lastEventText: data.lastEventText,
                  currentEventId: data.currentEventId,
                  storyState: data.storyState,
                  history: data.history,
                  choicePath: data.choicePath,
                }
              : slot
          );
          return { slots: next as [SaveSlot, SaveSlot, SaveSlot] };
        }),

      deleteSlot: (slotId) =>
        set((s) => {
          const next = s.slots.map((slot) =>
            slot.slotId === slotId ? emptySlot(slotId) : slot
          );
          return { slots: next as [SaveSlot, SaveSlot, SaveSlot] };
        }),
    }),
    {
      name: 'interactive-story-saves',
    }
  )
);
