import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../features/auth/context/useAuth";
import { Spinner } from "../ui/Spinner";
import { AccountMenu } from "./AccountMenu";
import { useSearchMovies } from "../../features/movies/useHomeMovies";
import type { Movie } from "../../features/movies/types";

type SiteHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
};

export default function SiteHeader({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: SiteHeaderProps) {
  const { user, status, openAuth, logout, logoutPending } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchMovies = useSearchMovies(
    searchOpen && Boolean(debouncedSearch.trim()),
  );
  const isDebouncing = searchValue.trim() !== debouncedSearch;
  const searchResults: Movie[] = [
    ...(searchMovies.nowPlaying.data ?? []),
    ...(searchMovies.comingSoon.data ?? []),
  ].filter(
    (movie, index, movies) =>
      movies.findIndex((candidate) => candidate.id === movie.id) === index &&
      movie.title
        .toLocaleLowerCase()
        .includes(debouncedSearch.toLocaleLowerCase()),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    if (onSearchSubmit) onSearchSubmit();
    else navigate("/", { state: { search: searchValue.trim() } });
  };

  const clearSearch = () => {
    onSearchChange("");
    setDebouncedSearch("");
    searchInputRef.current?.focus();
  };

  const searchLoading =
    Boolean(searchValue.trim()) &&
    (isDebouncing ||
      searchMovies.nowPlaying.isPending ||
      searchMovies.comingSoon.isPending);
  const searchError =
    searchMovies.nowPlaying.isError || searchMovies.comingSoon.isError;
  const retrySearch = () => {
    void searchMovies.nowPlaying.refetch();
    void searchMovies.comingSoon.refetch();
  };

  return (
    <header className="relative z-20 mx-auto flex h-16 w-full max-w-[1800px] items-center gap-8 px-4 sm:px-8 lg:px-12">
      <Link
        to="/"
        className="hidden shrink-0 items-center text-[15px] font-black tracking-widest text-white sm:inline-flex"
        aria-label="Kino XII home"
      >
        KINO <span className="ml-1 text-[#f43b24]">XII</span>
      </Link>

      <nav className="hidden items-center gap-7 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 sm:flex">
        <Link className="transition hover:text-white" to="/sessions">
          Sessions
        </Link>
      </nav>

      <div
        className="relative min-w-0 flex-1 sm:max-w-135 sm:ml-auto"
        onBlur={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setSearchOpen(false);
          }
        }}
      >
        <form
          onSubmit={submitSearch}
          className="flex h-11 min-w-0 items-center gap-3 rounded-full border border-white/15 bg-[#dfe3e6]/20 px-4 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20"
        >
          <label className="sr-only" htmlFor="site-search">
            Search movies
          </label>
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-slate-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" />
          </svg>
          <input
            ref={searchInputRef}
            id="site-search"
            type="text"
            autoComplete="off"
            value={searchValue}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSearchOpen(false);
            }}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search films and live events"
            className="site-search-input min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-slate-300"
            aria-expanded={searchOpen}
            aria-controls="site-search-panel"
            aria-autocomplete="list"
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-sm leading-none text-white transition hover:bg-white/25"
            >
              ×
            </button>
          )}
        </form>

        {searchOpen && (
          <section
            id="site-search-panel"
            aria-label="Search results"
            aria-live="polite"
            className="absolute left-0 top-full z-50 mt-3 w-full overflow-hidden rounded-xl border border-white/10 bg-[#080d1d] shadow-2xl shadow-black/60"
          >
            {!searchValue.trim() ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-5 py-6 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-[#202536] text-white">
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="10.8" cy="10.8" r="6.8" />
                    <path d="m16 16 4.2 4.2" />
                  </svg>
                </span>
                <h2 className="mt-4 text-sm font-bold text-white">
                  What do you want to watch?
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Search the catalogue by movie title
                </p>
                <Link
                  to="/sessions"
                  onClick={() => setSearchOpen(false)}
                  className="mt-5 rounded-full bg-[#202536] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#2a3043]"
                >
                  Browse all sessions
                </Link>
              </div>
            ) : searchLoading ? (
              <div className="space-y-4 p-5" aria-label="Searching">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-3"
                  >
                    <div className="h-14 w-10 rounded bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/5 rounded bg-white/10" />
                      <div className="h-2 w-1/3 rounded bg-white/8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchError ? (
              <div className="grid min-h-56 place-content-center px-5 text-center">
                <p className="text-sm font-bold">Search is unavailable</p>
                <button
                  type="button"
                  onClick={retrySearch}
                  className="mt-3 text-xs font-bold text-[#ff604c] hover:text-white"
                >
                  Try again
                </button>
              </div>
            ) : searchResults.length ? (
              <>
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-[10px]">
                  <h2 className="font-bold uppercase tracking-wider text-slate-300">
                    Films &amp; events
                  </h2>
                  <span className="text-slate-400">
                    {searchResults.length} results
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {searchResults.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movies/${movie.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-white/6 focus-visible:bg-white/6"
                    >
                      <img
                        src={movie.posterUrl}
                        alt=""
                        loading="lazy"
                        className="h-14 w-10 shrink-0 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-xs text-white">
                          {movie.title}
                        </strong>
                        <span className="mt-1 block text-[10px] text-slate-400">
                          {movie.kind === "event" ? "Event" : "Film"} ·{" "}
                          {movie.ageRating.code} · {movie.runtimeMinutes} min
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-bold ${movie.isComingSoon ? "text-amber-400" : "text-white"}`}
                      >
                        {movie.isComingSoon
                          ? "Coming Soon"
                          : `from ₾${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(movie.fromPrice)}`}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid min-h-56 place-content-center px-5 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#202536] text-white">
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="10.8" cy="10.8" r="6.8" />
                    <path d="m16 16 4.2 4.2" />
                  </svg>
                </span>
                <h2 className="mt-4 text-sm font-bold text-white">
                  No results for &quot;{debouncedSearch}&quot;
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Check the spelling or try another film or live event.
                </p>
                <Link
                  to="/sessions"
                  onClick={() => setSearchOpen(false)}
                  className="mx-auto mt-5 rounded-full bg-[#202536] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#2a3043]"
                >
                  Browse all sessions
                </Link>
              </div>
            )}
          </section>
        )}
      </div>

      {status === "loading" ? (
        <span className="order-2 hidden shrink-0 items-center gap-2 text-[10px] text-slate-400 sm:flex">
          <Spinner label="Restoring account" />
          Restoring…
        </span>
      ) : user ? (
        <div className="order-2">
          <AccountMenu
            user={user}
            logout={logout}
            logoutPending={logoutPending}
          />
        </div>
      ) : (
        <div className="order-2 flex shrink-0 items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAuth("register")}
          >
            Sign up
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAuth("login")}
          >
            Log in
          </Button>
        </div>
      )}
    </header>
  );
}
