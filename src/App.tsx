import { useEffect, useState } from 'react';
import type { Story } from './types/story';
import { GameScreen } from './components/GameScreen';

export default function App() {
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/story.json')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch story');
        return r.json();
      })
      .then(setStory)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[#8b3a3a] font-serif italic">
          Could not load story.json
        </p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[#4a3f30] font-serif italic">Loading…</p>
      </div>
    );
  }

  return <GameScreen story={story} />;
}
