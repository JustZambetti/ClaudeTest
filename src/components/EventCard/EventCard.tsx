import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { StoryEvent } from '../../types/story';
import type { CardPhase, ResolvedOutcome } from '../../store/gameStore';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';

interface EventCardProps {
  event: StoryEvent;
  cardPhase: CardPhase;
  pendingOutcome: ResolvedOutcome | null;
  onSelectChoice: (choiceId: string) => void;
  onConfirmConsequence: () => void;
  onContinueNarrative: () => void;
  onSetCardPhase: (phase: CardPhase) => void;
}

// Variants for the flip between front and back faces.
// The card "collapses" horizontally (scaleX → 0) then "expands" the other face.
// This simulates a card flip without requiring CSS preserve-3d.
const EASE_IN = 'easeIn' as const;
const EASE_OUT = 'easeOut' as const;

const faceExitVariants = {
  exit: {
    scaleX: 0,
    opacity: 0,
    transition: { duration: 0.18, ease: EASE_IN },
  },
};

const faceEnterVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.18, ease: EASE_OUT },
  },
};

export function EventCard({
  event,
  cardPhase,
  pendingOutcome,
  onSelectChoice,
  onConfirmConsequence,
  onContinueNarrative,
  onSetCardPhase,
}: EventCardProps) {
  // Local face state — drives AnimatePresence key.
  // Initialise from persisted cardPhase (e.g. user refreshed on back face).
  const [faceShowing, setFaceShowing] = useState<'front' | 'back'>(
    cardPhase === 'back' ? 'back' : 'front'
  );

  // Sync local face state with store cardPhase changes.
  useEffect(() => {
    if (cardPhase === 'flipping') {
      setFaceShowing('back');
    } else if (cardPhase === 'front') {
      setFaceShowing('front');
    }
  }, [cardPhase]);

  function handleExitComplete() {
    // After the front face has fully exited, advance the store to 'back'
    // so that the Continue button becomes interactive at the right moment.
    if (cardPhase === 'flipping') {
      onSetCardPhase('back');
    }
  }

  const showFront = faceShowing === 'front';

  return (
    <div
      className="
        relative flex flex-col
        bg-[#1a1714] border border-[#5c4a2a] rounded-2xl overflow-hidden
        shadow-[0_8px_40px_rgba(0,0,0,0.7)]
      "
      style={{ width: '88vw', maxWidth: 420, height: '72vh', maxHeight: 640 }}
    >
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {showFront ? (
          <motion.div
            key="front"
            className="absolute inset-0"
            variants={faceExitVariants}
            exit="exit"
          >
            <CardFront
              event={event}
              onSelectChoice={onSelectChoice}
              onContinueNarrative={onContinueNarrative}
              disabled={cardPhase === 'flipping'}
            />
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="absolute inset-0"
            initial={faceEnterVariants.initial}
            animate={faceEnterVariants.animate}
          >
            {pendingOutcome && (
              <CardBack
                outcome={pendingOutcome}
                onContinue={onConfirmConsequence}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
