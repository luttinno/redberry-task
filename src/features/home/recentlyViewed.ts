const RECENT_KEY = "kino-xii-recent-movies";

function readRecentIds(): number[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? (JSON.parse(stored) as number[]) : [];
  } catch {
    return [];
  }
}

export function rememberMovieVisit(movieId: number) {
  const next = [
    movieId,
    ...readRecentIds().filter((id) => id !== movieId),
  ].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function getRecentMovieIds() {
  return readRecentIds();
}
