import { motion, AnimatePresence } from 'framer-motion';
import { useSavesStore } from '../store/savesStore';

interface ReplayOverlayProps {
  isDone: boolean;
  currentStep: number;
  totalSteps: number;
  onSkip: () => void;
  onSaveToSlot: (slotId: 1 | 2 | 3) => void;
  onReturnToTitle: () => void;
}

export function ReplayOverlay({
  isDone,
  currentStep,
  totalSteps,
  onSkip,
  onSaveToSlot,
  onReturnToTitle,
}: ReplayOverlayProps) {
  const { slots } = useSavesStore();

  return (
    <>
      {/* ── Top bar — always visible during replay ──────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#0f0e0d]/90 to-transparent pointer-events-none">
        <p className="text-[#7a6035] font-serif text-xs italic">
          {isDone
            ? 'Replay complete'
            : `Replaying shared story… ${currentStep}/${totalSteps}`}
        </p>
        {!isDone && (
          <button
            onClick={onSkip}
            className="
              pointer-events-auto
              px-3 py-1 font-serif text-xs text-[#c8b896]
              bg-[#251e15] border border-[#5c4a2a] rounded-md
              hover:bg-[#2e2419] hover:border-[#7a6035]
              active:scale-[0.97] transition-all duration-150
            "
          >
            Skip →
          </button>
        )}
      </div>

      {/* ── Completion panel — shown after replay finishes ───────────────── */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-0 z-30 px-6 pb-10 pt-6 bg-gradient-to-t from-[#0f0e0d] via-[#0f0e0d]/95 to-transparent"
          >
            <p className="text-[#d4b87a] font-serif text-base text-center mb-1">
              You've caught up
            </p>
            <p className="text-[#5c4a2a] font-serif text-xs italic text-center mb-5">
              Save to a slot to continue playing from here.
            </p>

            <div className="flex flex-col gap-3">
              {(slots as typeof slots).map((slot) => (
                <button
                  key={slot.slotId}
                  onClick={() => onSaveToSlot(slot.slotId)}
                  className="
                    w-full min-h-[52px] px-4 font-serif text-sm text-[#c8b896]
                    bg-[#1a1714] border border-[#5c4a2a] rounded-lg
                    hover:bg-[#2e2419] hover:border-[#7a6035]
                    active:scale-[0.98] transition-all duration-150
                    flex items-center justify-between
                  "
                >
                  <span className="text-[#7a6035] text-xs tracking-widest uppercase">
                    Slot {slot.slotId}
                  </span>
                  <span className="text-sm">
                    {slot.isEmpty ? 'Save here' : `Overwrite — ${slot.lastEventText.slice(0, 28)}…`}
                  </span>
                </button>
              ))}

              <button
                onClick={onReturnToTitle}
                className="
                  w-full min-h-[44px] font-serif text-xs text-[#4a3f30]
                  hover:text-[#7a6035] transition-colors duration-150
                "
              >
                Return to title without saving
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interaction blocker during active replay ─────────────────────── */}
      {!isDone && (
        <div className="absolute inset-0 z-20 pointer-events-auto" />
      )}
    </>
  );
}
