import type { ResolvedOutcome } from '../../store/gameStore';
import { ImageWithShimmer } from '../UI/ImageWithShimmer';

interface CardBackProps {
  outcome: ResolvedOutcome;
  onContinue: () => void;
}

export function CardBack({ outcome, onContinue }: CardBackProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Consequence image — same proportions as front */}
      <div className="shrink-0" style={{ height: '45%' }}>
        <ImageWithShimmer
          src={outcome.consequenceImage}
          alt="Consequence illustration"
          className="w-full h-full"
        />
      </div>

      {/* Consequence text + continue */}
      <div className="flex flex-col flex-1 min-h-0 px-5 pt-4 pb-4">
        {/* Choice label reminder */}
        <p className="shrink-0 text-[#7a6a4f] font-serif text-xs italic mb-3 select-none">
          You chose: {outcome.choiceLabel}
        </p>

        {/* Consequence text — scrollable if long */}
        <div className="flex-1 overflow-y-auto min-h-0 mb-4 scrollbar-none">
          <p className="text-[#e8e0d0] font-serif text-[1.05rem] leading-[1.75] italic select-none">
            {outcome.consequenceText}
          </p>
        </div>

        {/* Continue button */}
        <div className="shrink-0">
          <button
            onClick={onContinue}
            className="
              w-full min-h-[52px] px-8
              font-serif text-sm text-[#c8b896]
              bg-[#251e15] border border-[#5c4a2a] rounded-lg
              hover:bg-[#2e2419] hover:border-[#7a6035]
              active:scale-[0.98] transition-all duration-150
            "
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
