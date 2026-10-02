import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import SiteHeader from "../../components/layout/SiteHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../auth/context/useAuth";
import { useHomeMovies, useNotifyMovie } from "../movies/useHomeMovies";
import type { Movie } from "../movies/types";
import { getRecentMovieSlugs } from "./recentlyViewed";

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}

function formatReleaseDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <article className="group w-39 shrink-0 sm:w-57.5 lg:w-62.5">
      <Link
        to={`/movies/${movie.slug}`}
        className="relative block aspect-2/3 overflow-hidden rounded-lg bg-[#171b2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fb432c]"
        aria-label={`View ${movie.title}`}
      >
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white">
          {movie.ageRating.code}
        </span>
      </Link>
      <div className="pt-3">
        <Link
          to={`/movies/${movie.slug}`}
          className="line-clamp-1 text-sm font-bold text-white hover:text-[#ff604c]"
        >
          {movie.title}
        </Link>
        <p className="mt-1 text-[11px] text-slate-400">
          {formatRuntime(movie.runtimeMinutes)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="whitespace-nowrap text-[10px] text-slate-400">
            From <strong className="text-slate-200">₾{movie.fromPrice}</strong>
          </span>
          <Link
            to={`/movies/${movie.id}`}
            className="rounded-full bg-[#f23a23] px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#d92e1a]"
          >
            Buy ticket
          </Link>
        </div>
      </div>
    </article>
  );
}

function MovieSkeleton({ landscape = false }: { landscape?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#171b2b] ${landscape ? "h-28 min-w-67.5" : "aspect-2/3 min-w-39"}`}
    />
  );
}

export default function HomePage() {
  const location = useLocation();
  const initialSearch =
    (location.state as { search?: string } | null)?.search ?? "";
  const { user, requireAuth } = useAuth();
  const { featured, nowPlaying, comingSoon } = useHomeMovies();
  const notifyMutation = useNotifyMovie();
  const [activeSlide, setActiveSlide] = useState(0);
  const [search, setSearch] = useState(initialSearch);

  const featuredMovies = featured.data ?? [];
  const activeIndex = featuredMovies.length
    ? activeSlide % featuredMovies.length
    : 0;
  const currentFeature = featuredMovies[activeIndex];
  const allMovies = [...(nowPlaying.data ?? []), ...(comingSoon.data ?? [])];
  const query = search.trim().toLocaleLowerCase();
  const visibleNowPlaying =
    nowPlaying.data?.filter((movie) =>
      movie.title.toLocaleLowerCase().includes(query),
    ) ?? [];
  const visibleComingSoon =
    comingSoon.data?.filter((movie) =>
      movie.title.toLocaleLowerCase().includes(query),
    ) ?? [];
  const recentMovies = getRecentMovieSlugs()
    .map((slug) => allMovies.find((movie) => movie.slug === slug))
    .filter((movie): movie is Movie => Boolean(movie));

  useEffect(() => {
    if (featuredMovies.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveSlide((index) => (index + 1) % featuredMovies.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [featuredMovies.length]);

  const requestNotification = (movie: Movie) => {
    requireAuth(async () => {
      await notifyMutation.mutateAsync(movie.id);
      toast.success(`We’ll let you know when ${movie.title} is available.`);
    });
  };

  return (
    <main className="min-h-screen bg-[#070c1c] text-white">
      <SiteHeader searchValue={search} onSearchChange={setSearch} />

      <section className="relative isolate min-h-125 overflow-hidden sm:min-h-145">
        {currentFeature ? (
          <img
            key={currentFeature.backdropUrl}
            src={currentFeature.backdropUrl}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full animate-[heroFade_.6s_ease-out] object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 -z-20 animate-pulse bg-[#112b38]" />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,10,19,.94)_0%,rgba(5,10,19,.72)_43%,rgba(5,10,19,.12)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#070c1c_0%,transparent_48%,rgba(5,10,19,.12)_100%)]" />

        <div className="flex min-h-125 max-w-2xl flex-col justify-center px-6 pb-20 pt-12 sm:min-h-145 sm:px-10 lg:px-14">
          {featured.isError ? (
            <div className="max-w-sm">
              <p className="text-sm text-slate-200">
                Featured films are temporarily unavailable.
              </p>
              <button
                className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20"
                onClick={() => void featured.refetch()}
              >
                Retry
              </button>
            </div>
          ) : currentFeature ? (
            <div
              key={currentFeature.id}
              className="animate-[heroRise_.5s_ease-out]"
            >
              <p className="mb-3 text-[10px] font-black uppercase tracking-[.18em] text-[#ff4a31]">
                Featured · only in cinemas
              </p>
              <h1 className="max-w-xl text-4xl font-black leading-[.98] sm:text-6xl">
                {currentFeature.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-200">
                <span className="rounded bg-[#f23a23] px-2 py-1">
                  {currentFeature.ageRating.code}
                </span>
                <span className="rounded bg-white/10 px-2 py-1">
                  {formatRuntime(currentFeature.runtimeMinutes)}
                </span>
                {currentFeature.formats.slice(0, 3).map((format) => (
                  <span
                    key={format.id}
                    className="rounded bg-white/10 px-2 py-1"
                  >
                    {format.name}
                  </span>
                ))}
              </div>
              <p className="mt-4 max-w-lg text-xs leading-5 text-slate-200/85 sm:text-sm sm:leading-6">
                {currentFeature.ageRating.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/movies/${currentFeature.slug}`}
                  className="rounded-full bg-[#f23a23] px-5 py-2.5 text-[11px] font-bold shadow-lg shadow-black/20 hover:bg-[#d92e1a]"
                >
                  Buy tickets
                </Link>
                <Link
                  to="/sessions"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-[11px] font-bold backdrop-blur hover:bg-white/20"
                >
                  All sessions
                </Link>
              </div>
            </div>
          ) : featured.isPending ? (
            <div className="max-w-lg animate-pulse">
              <div className="h-3 w-40 rounded bg-white/20" />
              <div className="mt-5 h-14 w-4/5 rounded bg-white/20" />
              <div className="mt-5 h-4 w-3/5 rounded bg-white/15" />
              <div className="mt-7 h-10 w-36 rounded-full bg-white/20" />
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              No featured films are available right now.
            </p>
          )}
        </div>

        <div className="absolute bottom-7 left-6 right-6 flex items-center gap-3 sm:left-10 sm:right-10 lg:left-14 lg:right-14">
          <div className="flex flex-1 gap-1.5">
            {featuredMovies.map((movie, index) => (
              <button
                key={movie.id}
                className="h-1 flex-1 overflow-hidden rounded bg-white/50"
                aria-label={`Show featured film ${index + 1}: ${movie.title}`}
                aria-current={activeIndex === index}
                onClick={() => setActiveSlide(index)}
              >
                <span
                  className={`block h-full bg-[#f23a23] transition-all duration-300 ${activeIndex === index ? "w-full" : "w-0"}`}
                />
              </button>
            ))}
            {!featuredMovies.length && (
              <span className="h-1 flex-1 rounded bg-white/30" />
            )}
          </div>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-black/25 text-lg text-white hover:bg-white/20 disabled:opacity-30"
            aria-label="Previous featured film"
            disabled={featuredMovies.length < 2}
            onClick={() =>
              setActiveSlide(
                (index) =>
                  (index - 1 + featuredMovies.length) % featuredMovies.length,
              )
            }
          >
            ‹
          </button>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-black/25 text-lg text-white hover:bg-white/20 disabled:opacity-30"
            aria-label="Next featured film"
            disabled={featuredMovies.length < 2}
            onClick={() =>
              setActiveSlide((index) => (index + 1) % featuredMovies.length)
            }
          >
            ›
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-[1800px] px-5 pb-20 sm:px-8 lg:px-12">
        {user && recentMovies.length > 0 && (
          <section
            className="border-b border-white/8 py-7"
            aria-labelledby="recent-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="recent-title" className="text-sm font-extrabold">
                Recently viewed
              </h2>
              <span className="text-[10px] text-slate-500">
                Your last opened films
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recentMovies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movies/${movie.slug}`}
                  className="flex min-w-52.5 items-center gap-3 rounded-lg bg-[#181c2b] p-2.5 transition hover:bg-[#202437]"
                >
                  <img
                    src={movie.posterUrl}
                    alt=""
                    loading="lazy"
                    className="h-14 w-10 rounded object-cover"
                  />
                  <span className="min-w-0">
                    <strong className="block truncate text-[11px]">
                      {movie.title}
                    </strong>
                    <small className="mt-1 block text-[9px] text-slate-400">
                      {formatRuntime(movie.runtimeMinutes)} ·{" "}
                      {movie.ageRating.code}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section
          id="now-playing"
          className="border-b border-white/8 py-8"
          aria-labelledby="now-title"
        >
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2
              id="now-title"
              className="text-base font-black uppercase tracking-wide"
            >
              Now playing
            </h2>
            <Link
              to="/sessions"
              className="text-[10px] font-bold text-[#ff604c] hover:text-white"
            >
              See all sessions <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {nowPlaying.isError ? (
            <ErrorState
              message="We couldn’t load these movies."
              onRetry={() => void nowPlaying.refetch()}
            />
          ) : nowPlaying.isPending ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }, (_, index) => (
                <MovieSkeleton key={index} />
              ))}
            </div>
          ) : visibleNowPlaying.length ? (
            <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-color:#35394b_transparent] scrollbar-thin">
              {visibleNowPlaying.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white/3 px-5 py-8 text-sm text-slate-400">
              No matching films found.
            </p>
          )}
        </section>

        <section className="py-8" aria-labelledby="coming-title">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2
              id="coming-title"
              className="text-base font-black uppercase tracking-wide"
            >
              Coming soon
            </h2>
            <span className="text-[10px] text-slate-500">
              Arriving on the big screen
            </span>
          </div>
          {comingSoon.isError ? (
            <ErrorState
              message="We couldn’t load these movies."
              onRetry={() => void comingSoon.refetch()}
            />
          ) : comingSoon.isPending ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <MovieSkeleton key={index} landscape />
              ))}
            </div>
          ) : visibleComingSoon.length ? (
            <div className="flex gap-3 overflow-x-auto pb-3 [scrollbar-color:#35394b_transparent] scrollbar-thin">
              {visibleComingSoon.map((movie) => (
                <article
                  key={movie.id}
                  className="flex min-w-70 basis-90 items-center gap-3 rounded-lg bg-[#181c2b] p-2.5 sm:basis-97.5"
                >
                  <Link
                    to={`/movies/${movie.slug}`}
                    className="h-23 w-26 shrink-0 overflow-hidden rounded-md bg-[#202436]"
                  >
                    <img
                      src={movie.posterUrl}
                      alt={`${movie.title} poster`}
                      loading="lazy"
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </Link>
                  <div className="min-w-0 flex-1 self-stretch py-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#f23a23]/15 px-1.5 py-1 text-[9px] font-bold text-[#ff705b]">
                        {movie.ageRating.code}
                      </span>
                      <span className="truncate text-[9px] text-slate-500">
                        {formatRuntime(movie.runtimeMinutes)}
                      </span>
                    </div>
                    <Link
                      to={`/movies/${movie.slug}`}
                      className="mt-2 block line-clamp-2 text-[11px] font-bold leading-4 hover:text-[#ff604c]"
                    >
                      {movie.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[9px] text-slate-400">
                        {formatReleaseDate(movie.releaseDate)}
                      </span>
                      <button
                        className="rounded-full border border-white/20 px-2.5 py-1 text-[9px] font-bold text-slate-200 transition hover:border-[#ff604c] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          movie.isNotified ||
                          (notifyMutation.isPending &&
                            notifyMutation.variables === movie.id)
                        }
                        onClick={() => requestNotification(movie)}
                      >
                        {movie.isNotified
                          ? "Notified"
                          : notifyMutation.isPending &&
                              notifyMutation.variables === movie.id
                            ? "Saving…"
                            : "Notify me"}
                        {notifyMutation.isPending &&
                          notifyMutation.variables === movie.id && (
                            <Spinner label="Saving notification" />
                          )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-white/3 px-5 py-8 text-sm text-slate-400">
              No upcoming films found.
            </p>
          )}
        </section>

        <footer className="flex items-center justify-between border-t border-white/8 pt-5 text-[9px] text-slate-500">
          <Link to="/" className="font-black tracking-wide text-white">
            KINO <span className="text-[#f43b24]">XII</span>
          </Link>
          <span>© 2026 Kino XII. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}
