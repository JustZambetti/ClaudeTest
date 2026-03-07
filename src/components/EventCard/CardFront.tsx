import { useState } from 'react';
import type { StoryEvent } from '../../types/story';
import { isChoiceEvent, isNarrativeEvent } from '../../types/story';
import { ImageWithShimmer } from '../UI/ImageWithShimmer';

interface CardFrontProps {
  event: StoryEvent;
  onSelectChoice: (choiceId: string) => void;
  onContinueNarrative: () => void;
  disabled?: boolean;
}

export function CardFront({ event, onSelectChoice, onContinueNarrative, disabled }: CardFrontProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleChoice(choiceId: string) {
    if (disabled || selectedId) return;
    setSelectedId(choiceId);
    // Small delay so the button highlight is visible before the flip starts
    setTimeout(() => onSelectChoice(choiceId), 120);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Image area — top 45% */}
      <div className="shrink-0" style={{ height: '45%' }}>
        <ImageWithShimmer
          src={event.image}
          alt="Event illustration"
          className="w-full h-full"
        />
      </div>

      {/* Text + buttons — bottom 55% */}
      <div className="flex flex-col flex-1 min-h-0 px-5 pt-4 pb-4">
        {/* Story text — scrollable if very long */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4 scrollbar-none">
          <p className="text-[#e8e0d0] font-serif text-[1.05rem] leading-[1.75] select-none">
            {event.text}
          </p>
        </div>

        {/* Buttons */}
        {isChoiceEvent(event) && (
          <div className="flex gap-3 shrink-0">
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                disabled={disabled || selectedId !== null}
                className={`
                  flex-1 min-h-[52px] px-3 py-2
                  font-serif text-sm leading-snug
                  border rounded-lg
                  transition-all duration-150 select-none
                  ${selectedId === choice.id
                    ? 'bg-[#3d2e1a] border-[#a07820] text-[#f0d88a] scale-[0.97]'
                    : 'bg-[#251e15] border-[#5c4a2a] text-[#c8b896] hover:bg-[#2e2419] hover:border-[#7a6035] active:scale-[0.97]'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {isNarrativeEvent(event) && (
          <div className="flex justify-center shrink-0">
            <button
              onClick={onContinueNarrative}
              disabled={disabled}
              className="
                px-8 min-h-[52px] w-full
                font-serif text-sm text-[#c8b896]
                bg-[#251e15] border border-[#5c4a2a] rounded-lg
                hover:bg-[#2e2419] hover:border-[#7a6035]
                active:scale-[0.98] transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
