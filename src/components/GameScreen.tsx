import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Story } from '../types/story';
import { isEndingEvent } from '../types/story';
import { useStoryEngine } from '../hooks/useStoryEngine';
import { useGameStore } from '../store/gameStore';
import { EventCard } from './EventCard/EventCard';

interface GameScreenProps {
  story: Story;
}

// Card advance variants: old card exits left, new card enters from right.
const EASE_IN = 'easeIn' as const;
const EASE_OUT = 'easeOut' as const;

const cardAdvanceVariants = {
  initial: { x: 80, opacity: 0, scale: 0.95 },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    x: -80,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.24, ease: EASE_IN },
  },
};

export function GameScreen({ story }: GameScreenProps) {
  const engine = useStoryEngine(story);
  const setCardPhase = useGameStore((s) => s.setCardPhase);
  const currentEventId = useGameStore((s) => s.currentEventId);

  // Phase 3: auto-start on slot 1 if no game is active yet.
  // TitleScreen (Phase 4) will replace this.
  useEffect(() => {
    if (!currentEventId) {
      engine.startNewGame(1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!engine.currentEvent) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[#4a3f30] font-serif italic">Loading…</p>
      </div>
    );
  }

  // Ending screen
  if (isEndingEvent(engine.currentEvent)) {
    const ending = engine.currentEvent;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6 text-center"
          style={{ width: '88vw', maxWidth: 420 }}
        >
          {/* Ending image */}
          <div
            className="w-full overflow-hidden rounded-xl border border-[#5c4a2a]"
            style={{ height: 260 }}
          >
            <img
              src={ending.image}
              alt={ending.endingTitle}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-[#5c4a2a]" />

          {/* Ending title */}
          <h2 className="text-[#d4b87a] font-serif text-2xl tracking-wide">
            {ending.endingTitle}
          </h2>

          {/* Ending text */}
          <p className="text-[#c8b896] font-serif text-base leading-[1.8] italic">
            {ending.text}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full pt-2">
            <button
              onClick={() => engine.startNewGame(1)}
              className="
                w-full min-h-[52px] font-serif text-sm text-[#c8b896]
                bg-[#251e15] border border-[#5c4a2a] rounded-lg
                hover:bg-[#2e2419] hover:border-[#7a6035]
                active:scale-[0.98] transition-all duration-150
              "
            >
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center">
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
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
