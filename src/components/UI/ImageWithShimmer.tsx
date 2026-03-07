import { useState } from 'react';

interface ImageWithShimmerProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithShimmer({ src, alt, className = '' }: ImageWithShimmerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Shimmer skeleton — visible while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-[#1e1b16]">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-[#2c2620]/40 to-transparent" />
        </div>
      )}

      {/* Image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 bg-[#1a1714] flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 border border-[#4a3f30] rounded flex items-center justify-center">
            <span className="text-[#4a3f30] text-lg">?</span>
          </div>
          <span className="text-[#4a3f30] text-xs font-serif italic">No image</span>
        </div>
      )}

      {/* Bottom vignette — fades image into card body */}
      {loaded && (
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1a1714] to-transparent pointer-events-none" />
      )}
    </div>
  );
}
