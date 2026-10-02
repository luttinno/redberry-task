import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import { useAuth } from "../auth/context/useAuth";
import { rememberMovieVisit } from "../home/recentlyViewed";
import type { MovieSession } from "./types";
import { useMovieDetail, useMovieSessions } from "./useMovieDetails";

function getNextSevenDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      weekday: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    };
  });
}

function getAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${minutes} min`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatPrice(value: number) {
  return `₾${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)}`;
}

function groupSessions(sessions: MovieSession[]) {
  const groups = new Map<string, { label: string; sessions: MovieSession[] }>();
  sessions.forEach((session) => {
    const venue = session.venue ?? session.hall?.venue;
    const hallName = session.hall?.name;
    const key = `${venue?.id ?? venue?.slug ?? venue?.name ?? "venue"}-${session.hall?.id ?? hallName ?? session.id}`;
    const group = groups.get(key) ?? {
      label:
        [venue?.name, hallName ? `Hall ${hallName}` : null]
          .filter(Boolean)
          .join(" · ") || "Cinema session",
      sessions: [],
    };
    group.sessions.push(session);
    groups.set(key, group);
  });
  return [...groups.values()];
}

function SessionCard({
  session,
  disabled,
  onSelect,
}: {
  session: MovieSession;
  disabled: boolean;
  onSelect: () => void;
}) {
  const unavailable = disabled || session.isSoldOut || session.seatsLeft <= 0;
  const venueName =
    session.venue?.name ?? session.hall?.venue?.name ?? "Cinema";
  const hallName = session.hall?.name ?? "Hall";
  const formatName = session.format?.name ?? "Format unavailable";
  const languageName = session.language?.name ?? "Language unavailable";
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={unavailable}
      className={`grid min-h-24 grid-cols-2 gap-x-4 gap-y-2 rounded-lg border px-4 py-3 text-left transition sm:grid-cols-[.8fr_1.1fr_1fr_1fr_auto] sm:items-center ${
        unavailable
          ? "cursor-not-allowed border-white/5 bg-[#171a29] text-slate-500 opacity-60"
          : "border-white/8 bg-[#1c2030] text-white hover:border-[#f23a23]/70 hover:bg-[#222638]"
      }`}
      aria-label={`${session.time}, ${venueName}, ${hallName}, ${formatName}, ${languageName}, ${formatPrice(session.price)}, ${session.isSoldOut || session.seatsLeft <= 0 ? "sold out" : `${session.seatsLeft} seats left`}`}
    >
      <span className="text-lg font-black tabular-nums">{session.time}</span>
      <span className="text-xs font-bold sm:text-sm">{formatName}</span>
      <span className="text-xs text-slate-400">{languageName}</span>
      <span className="text-xs font-bold">{formatPrice(session.price)}</span>
      <span className="col-span-2 text-[10px] font-semibold text-slate-400 sm:col-span-1 sm:text-right">
        {session.isSoldOut || session.seatsLeft <= 0
          ? "Sold out"
          : `${session.seatsLeft} seats left`}
      </span>
    </button>
  );
}

export default function MovieDetailsPage() {
  const { movieId = "" } = useParams();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const dates = getNextSevenDays();
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [search, setSearch] = useState("");
  const movieQuery = useMovieDetail(movieId);
  const sessionsQuery = useMovieSessions(movieId, selectedDate);
  const movie = movieQuery.data;
  const age =
    status === "authenticated" ? getAge(user?.dateOfBirth ?? null) : null;
  const isUnderage =
    status === "authenticated" &&
    age !== null &&
    Boolean(movie && age < movie.ageRating.minAge);
  const sessionGroups = groupSessions(sessionsQuery.data ?? []);

  useEffect(() => {
    if (movieId) rememberMovieVisit(movieId);
  }, [movieId]);

  if (movieQuery.isPending) {
    return (
      <main className="min-h-screen animate-pulse bg-[#070c1c] text-white">
        <SiteHeader searchValue={search} onSearchChange={setSearch} />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="aspect-2/3 rounded-xl bg-white/8" />
          <div className="space-y-5 pt-10">
            <div className="h-10 max-w-xl rounded bg-white/8" />
            <div className="h-4 max-w-2xl rounded bg-white/8" />
            <div className="h-4 max-w-lg rounded bg-white/8" />
            <div className="h-32 rounded bg-white/8" />
          </div>
        </div>
      </main>
    );
  }

  if (movieQuery.isError || !movie) {
    const isNotFound =
      movieQuery.error instanceof ApiError && movieQuery.error.status === 404;
    return (
      <main className="min-h-screen bg-[#070c1c] text-white">
        <SiteHeader searchValue={search} onSearchChange={setSearch} />
        <section className="mx-auto grid min-h-[60vh] max-w-3xl place-content-center px-6 text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#ff604c]">
            {isNotFound ? "Movie not found" : "Movie details unavailable"}
          </p>
          <h1 className="mt-3 text-2xl font-black">
            {isNotFound
              ? "We couldn’t find this movie."
              : "Something went wrong."}
          </h1>
          {!isNotFound && (
            <button
              className="mx-auto mt-5 rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold hover:bg-white/20"
              onClick={() => void movieQuery.refetch()}
            >
              Retry
            </button>
          )}
          <Link
            to="/"
            className="mt-5 text-xs font-bold text-[#ff604c] hover:text-white"
          >
            Back to home
          </Link>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const handleSearchSubmit = () =>
    navigate("/", { state: { search: search.trim() } });

  return (
    <main className="min-h-screen bg-[#070c1c] text-white">
      <section className="relative isolate min-h-140 overflow-hidden bg-[#10232c] sm:min-h-152.5">
        {movie.backdropUrl ? (
          <img
            src={movie.backdropUrl}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 -z-20 bg-[#18232f]" />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,10,17,.93)_0%,rgba(4,10,17,.68)_48%,rgba(4,10,17,.22)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#070c1c_0%,transparent_68%)]" />
        <SiteHeader
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
        />
        <div className="mx-auto grid max-w-375 items-end gap-8 px-5 pb-14 pt-10 sm:px-8 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-10 lg:px-12 lg:pb-16">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              className="aspect-2/3 w-full max-w-52 rounded-xl object-cover shadow-2xl shadow-black/40 md:max-w-none"
            />
          ) : (
            <div className="grid aspect-2/3 w-full max-w-52 place-items-center rounded-xl bg-white/10 text-sm text-slate-400 md:max-w-none">
              Poster unavailable
            </div>
          )}
          <div className="max-w-3xl pb-1">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ff604c]">
              {movie.kind === "event" ? "Live event" : "Now showing"}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-[1.02] sm:text-6xl">
              {movie.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-200/85">
              {movie.synopsis ||
                "A description for this movie is not available."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-bold">
              <span className="rounded bg-[#f23a23] px-2.5 py-1.5">
                {movie.ageRating.code}
              </span>
              <span className="max-w-lg text-slate-200/75">
                {movie.ageRating.description ||
                  "Age rating details unavailable."}
              </span>
              <span className="rounded bg-white/12 px-2.5 py-1.5">
                {formatRuntime(movie.runtimeMinutes)}
              </span>
              {movie.formats.map((format) => (
                <span
                  key={format.id}
                  className="rounded bg-white/12 px-2.5 py-1.5"
                >
                  {format.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-375 gap-12 px-5 pb-16 pt-9 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14 lg:px-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Sessions</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                Choose a date to see available showtimes
              </p>
            </div>
            {isUnderage && (
              <p
                className="max-w-xl rounded-md border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-xs leading-5 text-amber-300"
                role="status"
              >
                This film is rated {movie.ageRating.code}. You cannot buy
                tickets for it with this account.
              </p>
            )}
          </div>

          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-2"
            aria-label="Choose session date"
          >
            {dates.map((date) => (
              <button
                key={date.value}
                type="button"
                aria-pressed={selectedDate === date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`grid min-w-16 place-items-center rounded-lg border px-3 py-2.5 transition ${
                  selectedDate === date.value
                    ? "border-[#f23a23] bg-[#f23a23] text-white"
                    : "border-white/8 bg-[#1c2030] text-slate-300 hover:border-white/25"
                }`}
              >
                <span className="text-[10px] font-bold">{date.weekday}</span>
                <span className="mt-0.5 text-lg font-black leading-5">
                  {date.day}
                </span>
                <span className="text-[9px]">{date.month}</span>
              </button>
            ))}
          </div>

          {sessionsQuery.isPending ? (
            <div className="mt-6 grid gap-5" aria-label="Loading sessions">
              {[0, 1].map((group) => (
                <div key={group} className="animate-pulse">
                  <div className="mb-3 h-3 w-40 rounded bg-white/10" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="h-24 rounded-lg bg-white/8" />
                    <div className="h-24 rounded-lg bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessionsQuery.isError ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/3 px-5 py-4 text-sm text-slate-300">
              <span>Sessions could not be loaded.</span>
              <button
                className="font-bold text-[#ff604c] hover:text-white"
                onClick={() => void sessionsQuery.refetch()}
              >
                Retry
              </button>
            </div>
          ) : sessionGroups.length === 0 ? (
            <p className="mt-6 rounded-lg border border-white/8 bg-white/3 px-5 py-6 text-sm text-slate-300">
              No sessions available for this date.
            </p>
          ) : (
            <div className="mt-6 space-y-7">
              {sessionGroups.map((group) => (
                <section key={group.label}>
                  <h3 className="mb-3 text-xs font-bold text-slate-200">
                    {group.label}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        disabled={isUnderage || status === "loading"}
                        onSelect={() =>
                          navigate(`/sessions/${session.id}/seats`)
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="border-t border-white/8 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="text-xl font-black">Details</h2>
          <dl className="mt-5 space-y-5 text-xs">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Director
              </dt>
              <dd className="mt-1 text-slate-100">
                {movie.director || "Not listed"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Main cast
              </dt>
              <dd className="mt-1 leading-5 text-slate-100">
                {movie.cast || "Not listed"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Genres
              </dt>
              <dd className="mt-1 text-slate-100">
                {movie.genres.length
                  ? movie.genres.map((genre) => genre.name).join(", ")
                  : "Not listed"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Duration
              </dt>
              <dd className="mt-1 text-slate-100">
                {formatRuntime(movie.runtimeMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Release date
              </dt>
              <dd className="mt-1 text-slate-100">
                {formatDate(movie.releaseDate)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Formats
              </dt>
              <dd className="mt-1 text-slate-100">
                {movie.formats.length
                  ? movie.formats.map((format) => format.name).join(", ")
                  : "Not listed"}
              </dd>
            </div>
          </dl>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
