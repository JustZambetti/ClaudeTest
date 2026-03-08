import { useState, useEffect } from 'react';

interface ImageWithShimmerProps {
  src: string;
  alt: string;
  className?: string;
  /** Override the vignette gradient start colour (default: #1a1714, the card body colour). */
  vignetteColor?: string;
}

export function ImageWithShimmer({
  src,
  alt,
  className = '',
  vignetteColor = '#1a1714',
}: ImageWithShimmerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset load state when the image URL changes so stale 'loaded' never leaks
  // to a new image (e.g. card advances reuse the same component instance).
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const missing = !src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Shimmer skeleton — visible while loading */}
      {!loaded && !error && !missing && (
        <div className="absolute inset-0 bg-[#1e1b16]">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-[#2c2620]/40 to-transparent" />
        </div>
      )}

      {/* Image */}
      {!error && !missing && (
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

      {/* Error / missing fallback */}
      {(error || missing) && (
        <div className="absolute inset-0 bg-[#1a1714] flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 border border-[#4a3f30] rounded flex items-center justify-center">
            <span className="text-[#4a3f30] text-lg">?</span>
          </div>
          <span className="text-[#4a3f30] text-xs font-serif italic">No image</span>
        </div>
      )}

      {/* Bottom vignette — always present once mounted, smoothly transitions with image */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${vignetteColor}, transparent)` }}
      />
    </div>
  );
}
