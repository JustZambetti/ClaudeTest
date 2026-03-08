import type { HistoryEntry } from '../../types/story';
import { ImageWithShimmer } from '../UI/ImageWithShimmer';

interface PastCardProps {
  entry: HistoryEntry;
}

// Dimensions at ~58% of the active card
const PAST_CARD_W = 'clamp(130px, 46vw, 215px)';
const PAST_CARD_H = 'clamp(185px, 42vh, 370px)';

export function PastCard({ entry }: PastCardProps) {
  return (
    <div
      className="shrink-0 flex flex-col rounded-xl overflow-hidden border border-[#3a3028] bg-[#1a1714]"
      style={{
        width: PAST_CARD_W,
        height: PAST_CARD_H,
        opacity: 0.45,
        filter: 'saturate(0.35)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Event image — top 45% */}
      <div className="shrink-0 overflow-hidden" style={{ height: '45%' }}>
        <ImageWithShimmer
          src={entry.eventImage}
          alt=""
          className="w-full h-full"
        />
      </div>

      {/* Text area — bottom 55% */}
      <div className="flex flex-col flex-1 min-h-0 px-2.5 pt-2.5 pb-2">
        <p className="text-[#c8b896] font-serif text-[0.65rem] leading-relaxed line-clamp-4 flex-1 min-h-0 overflow-hidden">
          {entry.eventText}
        </p>

        {/* Choice made — shown at the bottom if available */}
        {entry.choiceLabel && (
          <p className="text-[#7a6a4f] font-serif text-[0.6rem] italic mt-1.5 truncate shrink-0">
            ↳ {entry.choiceLabel}
          </p>
        )}
      </div>
    </div>
  );
}
