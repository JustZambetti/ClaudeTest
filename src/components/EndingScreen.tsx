import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EndingEvent } from '../types/story';
import { ImageWithShimmer } from './UI/ImageWithShimmer';

interface EndingScreenProps {
  ending: EndingEvent;
  choicePath: string[];
  onPlayAgain: () => void;
}

const EASE_OUT = 'easeOut' as const;

export function EndingScreen({ ending, choicePath, onPlayAgain }: EndingScreenProps) {
  const [showCopied, setShowCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?path=${choicePath.join(',')}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2500);
    });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="flex flex-col items-center gap-6 text-center"
        style={{ width: '88vw', maxWidth: 420 }}
      >
        <div
          className="w-full overflow-hidden rounded-xl border border-[#5c4a2a]"
          style={{ height: 260 }}
        >
          <ImageWithShimmer
            src={ending.image}
            alt={ending.endingTitle}
            className="w-full h-full"
            vignetteColor="#0f0e0d"
          />
        </div>

        <div className="w-12 h-px bg-[#5c4a2a]" />

        <h2 className="text-[#d4b87a] font-serif text-2xl tracking-wide">
          {ending.endingTitle}
        </h2>

        <p className="text-[#c8b896] font-serif text-base leading-[1.8] italic">
          {ending.text}
        </p>

        <div className="flex flex-col gap-3 w-full pt-2">
          {/* Share button — only when there's a path to encode */}
          {choicePath.length > 0 && (
            <div className="relative">
              <button
                onClick={handleShare}
                className="
                  w-full min-h-[52px] font-serif text-sm text-[#c8b896]
                  bg-[#251e15] border border-[#5c4a2a] rounded-lg
                  hover:bg-[#2e2419] hover:border-[#7a6035]
                  active:scale-[0.98] transition-all duration-150
                "
              >
                Share this ending
              </button>
              <AnimatePresence>
                {showCopied && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="
                      absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap
                      font-serif text-xs text-[#d4b87a]
                      bg-[#1a1714] border border-[#5c4a2a] rounded px-3 py-1
                    "
                  >
                    Link copied!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            onClick={onPlayAgain}
            className="
              w-full min-h-[44px] font-serif text-xs text-[#4a3f30]
              hover:text-[#7a6035] transition-colors duration-150
            "
          >
            Play Again
          </button>
        </div>
      </motion.div>
    </div>
  );
}
