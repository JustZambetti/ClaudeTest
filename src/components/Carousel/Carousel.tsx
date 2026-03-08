import { useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { HistoryEntry } from '../../types/story';
import { PastCard } from './PastCard';

interface CarouselProps {
  history: HistoryEntry[];
  /** The active EventCard wrapped in its advance AnimatePresence — provided by GameScreen. */
  children: ReactNode;
}

export function Carousel({ history, children }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // On first render: jump to the end instantly (no animation) so the active
  // card is always visible, even when resuming a save with many past cards.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  // When a new history entry is added: smooth-scroll to reveal the new active card.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || history.length === 0) return;
    // Small delay so the past card entrance animation has started before we scroll.
    const timer = setTimeout(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(timer);
  }, [history.length]);

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label="Story history"
      className="w-screen overflow-x-auto overflow-y-visible scrollbar-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Inner row — sized to its content so the scroll container knows its full width. */}
      <div
        className="flex items-center gap-3 py-6"
        style={{
          minWidth: 'max-content',
          // Leading gap before first past card; trailing gap after active card.
          paddingLeft: '1rem',
          paddingRight: '7vw',
        }}
      >
        {/* Past cards — AnimatePresence initial={false} prevents the entire
            history from animating in when loading from a save. Only newly
            appended entries get the entrance animation. */}
        <AnimatePresence initial={false}>
          {history.map((entry, i) => (
            <motion.div
              // eventId + index: stable for append-only history; handles loops.
              key={`${entry.eventId}-${i}`}
              initial={{ opacity: 0, x: 24, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="shrink-0"
            >
              <PastCard entry={entry} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Active card slot — children is the AnimatePresence + EventCard from GameScreen */}
        <div className="shrink-0">
          {children}
        </div>
      </div>
    </div>
  );
}
