const RECENT_KEY = "kino-xii-recent-movies";

function readRecentSlugs(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function rememberMovieVisit(movieSlug: string) {
  const next = [
    movieSlug,
    ...readRecentSlugs().filter((slug) => slug !== movieSlug),
  ].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function getRecentMovieSlugs() {
  return readRecentSlugs();
}
