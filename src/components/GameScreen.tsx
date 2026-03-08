import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Story } from '../types/story';
import { isEndingEvent } from '../types/story';
import { useStoryEngine } from '../hooks/useStoryEngine';
import { useReplay } from '../hooks/useReplay';
import { useGameStore } from '../store/gameStore';
import { useSavesStore } from '../store/savesStore';
import { EventCard } from './EventCard/EventCard';
import { Carousel } from './Carousel/Carousel';
import { ReplayOverlay } from './ReplayOverlay';
import { EndingScreen } from './EndingScreen';

interface GameScreenProps {
  story: Story;
  /** Set when starting a fresh game on a specific slot. Null when resuming or replaying. */
  newGameSlotId: 1 | 2 | 3 | null;
  onReturnToTitle: () => void;
  /** Parsed choice path from a shared URL. Non-empty = replay mode. */
  replayChoicePath?: string[];
  /** Called when the user saves a replay to a slot and wants to continue playing. */
  onReplaySaved?: (slotId: 1 | 2 | 3) => void;
}

const EASE_IN = 'easeIn' as const;
const EASE_OUT = 'easeOut' as const;

const cardAdvanceVariants = {
  initial: { x: 80, opacity: 0, scale: 0.95 },
  animate: {
    x: 0, opacity: 1, scale: 1,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    x: -60, opacity: 0, scale: 0.9,
    transition: { duration: 0.22, ease: EASE_IN },
  },
};

export function GameScreen({
  story,
  newGameSlotId,
  onReturnToTitle,
  replayChoicePath = [],
  onReplaySaved,
}: GameScreenProps) {
  const engine = useStoryEngine(story);
  const setCardPhase = useGameStore((s) => s.setCardPhase);
  const setActiveSaveSlot = useGameStore((s) => s.setActiveSaveSlot);
  const choicePath = useGameStore((s) => s.choicePath);
  const currentEventId = useGameStore((s) => s.currentEventId);
  const storyState = useGameStore((s) => s.storyState);
  const history = useGameStore((s) => s.history);
  const activeSaveSlot = useGameStore((s) => s.activeSaveSlot);
  const saves = useSavesStore();

  const isReplayMode = replayChoicePath.length > 0;

  const replay = useReplay(story, replayChoicePath, isReplayMode, {
    selectChoice: engine.selectChoice,
    confirmConsequence: engine.confirmConsequence,
    continueNarrative: engine.continueNarrative,
  });

  // Toast state for share button feedback
  const [showCopied, setShowCopied] = useState(false);

  // Start a fresh game when a new slot is provided (fires only on mount).
  useEffect(() => {
    if (newGameSlotId !== null) {
      engine.startNewGame(newGameSlotId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!engine.currentEvent) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[#4a3f30] font-serif italic">Loading…</p>
      </div>
    );
  }

  // ── Ending screen ──────────────────────────────────────────────────────────
  if (isEndingEvent(engine.currentEvent)) {
    return (
      <EndingScreen
        ending={engine.currentEvent}
        choicePath={choicePath}
        onPlayAgain={onReturnToTitle}
      />
    );
  }

  // ── Share handler ─────────────────────────────────────────────────────────
  function handleShare() {
    if (choicePath.length === 0) return;
    const url = `${window.location.origin}${window.location.pathname}?path=${choicePath.join(',')}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  }

  // ── Replay save handler ───────────────────────────────────────────────────
  function handleReplaySaved(slotId: 1 | 2 | 3) {
    setActiveSaveSlot(slotId);
    const currentEvent = story.events[currentEventId];
    const lastEventText = currentEvent ? currentEvent.text.slice(0, 60) : '';
    saves.saveToSlot(slotId, {
      currentEventId,
      storyState,
      history,
      choicePath: replayChoicePath,
      lastEventText,
    });
    onReplaySaved?.(slotId);
  }

  // ── Game screen with carousel ──────────────────────────────────────────────
  return (
    <div className="relative min-h-dvh flex flex-col justify-center overflow-hidden">

      {/* Replay overlay (top bar + completion panel) */}
      {isReplayMode && (
        <ReplayOverlay
          isDone={replay.isDone}
          currentStep={replay.currentStep}
          totalSteps={replay.totalSteps}
          onSkip={replay.skip}
          onSaveToSlot={handleReplaySaved}
          onReturnToTitle={onReturnToTitle}
        />
      )}

      {/* Menu button / share button row — hidden during active replay */}
      {(!isReplayMode || replay.isDone) && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">

          {/* Share button — only when there's a path to share */}
          {!isReplayMode && choicePath.length > 0 && (
            <div className="relative">
              <button
                onClick={handleShare}
                aria-label="Copy shareable link"
                className="
                  w-10 h-10 flex items-center justify-center
                  text-[#5c4a2a] hover:text-[#a07820]
                  transition-colors duration-150
                "
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="14" cy="3"  r="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="14" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="3"  cy="9"  r="2" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="4.8"  y1="8.1"  x2="12.2" y2="3.9"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="4.8"  y1="9.9"  x2="12.2" y2="14.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <AnimatePresence>
                {showCopied && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-11 right-0 whitespace-nowrap font-serif text-xs text-[#d4b87a] bg-[#1a1714] border border-[#5c4a2a] rounded px-2 py-1"
                  >
                    Link copied!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Hamburger / return to title — slot badge shows active save slot */}
          <button
            onClick={onReturnToTitle}
            aria-label={`Menu${activeSaveSlot !== null ? ` — Slot ${activeSaveSlot}` : ''}`}
            className="
              relative w-10 h-10 flex items-center justify-center
              text-[#5c4a2a] hover:text-[#a07820]
              transition-colors duration-150
            "
          >
            {activeSaveSlot !== null && (
              <span
                aria-hidden="true"
                className="
                  absolute top-0.5 right-0.5
                  w-4 h-4 rounded-full
                  bg-[#5c4a2a] border border-[#0f0e0d]
                  text-[#e8e0d0] text-[9px] font-serif leading-none
                  flex items-center justify-center
                "
              >
                {activeSaveSlot}
              </span>
            )}
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
              <rect y="0"  width="20" height="2" rx="1" fill="currentColor" />
              <rect y="6"  width="14" height="2" rx="1" fill="currentColor" />
              <rect y="12" width="20" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      <Carousel history={engine.history}>
        <AnimatePresence mode="wait">
          <motion.div
            key={engine.currentEvent.id}
            variants={cardAdvanceVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <EventCard
              event={engine.currentEvent}
              cardPhase={engine.cardPhase}
              pendingOutcome={engine.pendingOutcome}
              onSelectChoice={engine.selectChoice}
              onConfirmConsequence={engine.confirmConsequence}
              onContinueNarrative={engine.continueNarrative}
              onSetCardPhase={setCardPhase}
              disabled={isReplayMode && !replay.isDone}
            />
          </motion.div>
        </AnimatePresence>
      </Carousel>
    </div>
  );
}
