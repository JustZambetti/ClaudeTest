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
