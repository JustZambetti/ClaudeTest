import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Story } from './types/story';
import storyData from '../public/story.json';
import { useGameStore } from './store/gameStore';
import { useSavesStore } from './store/savesStore';
import { buildInitialState } from './engine/stateManager';
import { preloadStoryPath } from './engine/imagePreloader';
import { TitleScreen } from './components/TitleScreen/TitleScreen';
import { GameScreen } from './components/GameScreen';

const story = storyData as unknown as Story;

type Screen = 'title' | 'game';

// ── Parse replay path from URL (runs once at module load) ─────────────────
function consumeReplayPath(): string[] {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('path');
  if (!raw) return [];
  // Remove the query string so the URL stays clean
  window.history.replaceState({}, '', window.location.pathname);
  return raw.split(',').filter(Boolean);
}

export default function App() {
  const currentEventId = useGameStore((s) => s.currentEventId);
  const resetGame = useGameStore((s) => s.resetGame);
  const loadFromSave = useGameStore((s) => s.loadFromSave);
  const { slots } = useSavesStore();

  // Parse replay path from URL once; initialise game state for replay if found.
  const [replayChoicePath] = useState<string[]>(() => {
    const path = consumeReplayPath();
    if (path.length > 0) {
      // Overwrite any in-progress runtime state so the replay starts clean.
      const initialState = buildInitialState(story.initialState);
      useGameStore.getState().startGame(story.meta.startEventId, initialState, null);
      // Kick off background preload for every image in the recorded path so
      // the browser cache is warm before the animated replay reaches each card.
      preloadStoryPath(story, path);
    }
    return path;
  });

  const [isReplay, setIsReplay] = useState(() => replayChoicePath.length > 0);

  // Start on the game screen if a session was already in progress (or replay).
  const [screen, setScreen] = useState<Screen>(() => {
    if (replayChoicePath.length > 0) return 'game';
    return currentEventId ? 'game' : 'title';
  });

  // Tracks which slot to initialise when starting a fresh game.
  const [newGameSlotId, setNewGameSlotId] = useState<1 | 2 | 3 | null>(null);

  function handleNewGame(slotId: 1 | 2 | 3) {
    setNewGameSlotId(slotId);
    setScreen('game');
  }

  function handleResume(slotId: 1 | 2 | 3) {
    const slot = slots.find((s) => s.slotId === slotId);
    if (slot && !slot.isEmpty) {
      loadFromSave(slot);
    }
    setNewGameSlotId(null);
    setScreen('game');
  }

  function handleReturnToTitle() {
    resetGame();
    setNewGameSlotId(null);
    setIsReplay(false);
    setScreen('title');
  }

  function handleReplaySaved(_slotId: 1 | 2 | 3) {
    // The save itself is handled inside GameScreen; here we just exit replay mode.
    setIsReplay(false);
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'title' ? (
        <motion.div
          key="title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TitleScreen
            story={story}
            onNewGame={handleNewGame}
            onResume={handleResume}
          />
        </motion.div>
      ) : (
        <motion.div
          key="game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GameScreen
            story={story}
            newGameSlotId={isReplay ? null : newGameSlotId}
            onReturnToTitle={handleReturnToTitle}
            replayChoicePath={isReplay ? replayChoicePath : []}
            onReplaySaved={handleReplaySaved}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
