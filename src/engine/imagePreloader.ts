import type { Story } from '../types/story';
import { replayPath } from './pathReplayer';

const preloadedUrls = new Set<string>();

export function preloadImage(url: string): void {
  if (!url || preloadedUrls.has(url)) return;
  preloadedUrls.add(url);
  const img = new Image();
  img.src = url;
}

export function preloadImages(urls: string[]): void {
  urls.forEach(preloadImage);
}

/**
 * Bulk-preload every image reachable from a recorded choice path.
 * Used at replay start so images are already in the browser cache when
 * the animated replay reaches each card, eliminating loading flickers.
 */
export function preloadStoryPath(story: Story, choicePath: string[]): void {
  const result = replayPath(story, choicePath);
  const urls: string[] = [];

  for (const entry of result.history) {
    if (entry.eventImage) urls.push(entry.eventImage);
    if (entry.consequenceImage) urls.push(entry.consequenceImage);
  }

  // Also preload the current (final) event image
  const finalEvent = story.events[result.currentEventId];
  if (finalEvent?.image) urls.push(finalEvent.image);

  preloadImages(urls);
}
