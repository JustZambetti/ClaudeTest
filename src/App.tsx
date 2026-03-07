import type { Story } from './types/story';
import storyData from '../public/story.json';
import { GameScreen } from './components/GameScreen';

const story = storyData as unknown as Story;

export default function App() {
  return <GameScreen story={story} />;
}
