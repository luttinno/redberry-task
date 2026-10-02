import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import type { MovieSession } from "../movies/types";
import {
  getAvailableFormats,
  getNextSevenDates,
  parseSessionFilters,
  serializeSessionFilters,
  type SessionFilterState,
} from "./sessionFilters";
import { useFilterOptions } from "./useFilterOptions";
import { useSessions } from "./useSessions";

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${minutes} min`;
}

function formatPrice(value: number) {
  return `₾${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)}`;
}

function SessionShowtime({
  session,
  onSelect,
}: {
  session: MovieSession;
  onSelect: () => void;
}) {
  const soldOut = session.isSoldOut || session.seatsLeft <= 0;
  const venueName =
    session.venue?.name ?? session.hall?.venue?.name ?? "Cinema";
  const hallName = session.hall?.name ? `Hall ${session.hall.name}` : "Hall";
  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={onSelect}
      aria-label={`${session.time}, ${venueName}, ${hallName}, ${soldOut ? "sold out" : `${session.seatsLeft} seats left`}`}
      className={`grid min-h-20 min-w-38 grid-cols-[1fr_auto] gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-left transition ${
        soldOut
          ? "cursor-not-allowed border-white/5 bg-[#171a29] text-slate-500 opacity-60"
          : "border-white/5 bg-[#1c2030] text-white hover:border-[#f23a23]/60 hover:bg-[#232739]"
      }`}
    >
      <span className="text-sm font-black tabular-nums">{session.time}</span>
      <span className="justify-self-end rounded-full bg-white/8 px-2 py-1 text-[9px] font-bold text-slate-200">
        {session.format?.name ?? "Format unavailable"}
      </span>
      <span className="col-span-2 truncate text-[9px] text-slate-400">
        {session.language?.name ?? "Language unavailable"}
      </span>
      <span className="col-span-2 truncate text-[9px] text-slate-300">
        {venueName} · {hallName}
      </span>
      <span className="text-[10px] font-bold">
        {soldOut ? "Sold out" : `from ${formatPrice(session.price)}`}
      </span>
      {!soldOut && (
        <span className="justify-self-end text-[9px] font-bold text-emerald-300">
          {session.seatsLeft} left
        </span>
      )}
    </button>
  );
}

function FilterCheckbox({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 accent-[#f23a23]"
      />
      <span>{label}</span>
      {detail && <span className="text-[9px] text-slate-500">{detail}</span>}
    </label>
  );
}

export default function SessionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const optionsQuery = useFilterOptions();
  const options = optionsQuery.data;
  const dates = getNextSevenDates();
  const filters = parseSessionFilters(searchParams, options);
  const availableFormats = options
    ? getAvailableFormats(options, filters.venue)
    : [];
  const sessionsQuery = useSessions(
    {
      venue: filters.venue,
      date: filters.date,
      format: filters.format,
      language: filters.language,
      time: filters.time,
      sort: filters.sort,
      page: filters.page,
    },
    optionsQuery.isSuccess,
  );

  useEffect(() => {
    if (!options) return;
    const normalized = serializeSessionFilters(
      parseSessionFilters(searchParams, options),
    );
    if (normalized.toString() !== searchParams.toString()) {
      setSearchParams(normalized, { replace: true });
    }
  }, [options, searchParams, setSearchParams]);

  const movieGroups = (sessionsQuery.data?.data ?? [])
    .map((group) => ({
      ...group,
      sessions: filters.time.length
        ? group.sessions.filter((session) =>
            filters.time.includes(session.timeBand),
          )
        : group.sessions,
    }))
    .filter((group) => group.sessions.length > 0);
  const pageCount = Math.max(1, sessionsQuery.data?.meta.lastPage ?? 1);

  useEffect(() => {
    if (!sessionsQuery.isSuccess || filters.page <= pageCount) return;
    setSearchParams(serializeSessionFilters({ ...filters, page: pageCount }), {
      replace: true,
    });
  }, [filters, pageCount, sessionsQuery.isSuccess, setSearchParams]);

  const updateFilters = (
    patch: Partial<SessionFilterState>,
    resetPage = true,
  ) => {
    setSearchParams(
      serializeSessionFilters({
        ...filters,
        ...patch,
        page: resetPage ? 1 : (patch.page ?? filters.page),
      }),
    );
  };

  const toggle = (
    key: "venue" | "format" | "language" | "time",
    value: string,
  ) => {
    const selected = filters[key];
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    if (key === "venue") {
      const nextFormats = options
        ? getAvailableFormats(options, next).map((format) => format.slug)
        : [];
      updateFilters({
        venue: next,
        format: filters.format.filter((format) => nextFormats.includes(format)),
      });
      return;
    }
    updateFilters({ [key]: next });
  };

  const clearFilters = () =>
    updateFilters({ venue: [], format: [], language: [], time: [] });

  const handleSearchSubmit = () =>
    navigate("/", { state: { search: search.trim() } });
  const activeFilterCount =
    filters.venue.length +
    filters.format.length +
    filters.language.length +
    filters.time.length;
  const visibleGroups = movieGroups;
  const visibleSessionCount = movieGroups.reduce(
    (count, group) => count + group.sessions.length,
    0,
  );

  return (
    <main className="min-h-screen bg-[#070c1c] text-white">
      <SiteHeader
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
      />
      <div className="mx-auto max-w-[1800px] px-5 pb-16 pt-5 sm:px-8 lg:px-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black">Sessions</h1>
          <p className="mt-1 text-xs text-slate-400">
            Browse showtimes across all venues
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
          <aside className="lg:sticky lg:top-5">
            <div className="rounded-lg bg-[#1c2030] p-4 sm:p-5">
              <h2 className="mb-5 text-sm font-black">Filters</h2>
              {optionsQuery.isError ? (
                <div className="text-xs text-slate-300">
                  <p>Filter options could not be loaded.</p>
                  <button
                    className="mt-3 font-bold text-[#ff604c]"
                    onClick={() => void optionsQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : optionsQuery.isPending ? (
                <div
                  className="animate-pulse space-y-5"
                  aria-label="Loading filters"
                >
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded bg-white/5" />
                  ))}
                </div>
              ) : options ? (
                <div className="space-y-5">
                  <FilterSection title="Venue">
                    {options.venues.map((venue) => (
                      <FilterCheckbox
                        key={venue.id}
                        label={venue.name}
                        detail={venue.city}
                        checked={filters.venue.includes(venue.slug)}
                        onChange={() => toggle("venue", venue.slug)}
                      />
                    ))}
                  </FilterSection>

                  <FilterSection title="Date">
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {dates.map((date) => (
                        <button
                          key={date.value}
                          type="button"
                          aria-pressed={filters.date === date.value}
                          onClick={() => updateFilters({ date: date.value })}
                          className={`grid min-w-7 flex-1 place-items-center rounded px-1 py-2 text-center ${
                            filters.date === date.value
                              ? "bg-[#f23a23] text-white"
                              : "bg-[#111625] text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-[8px] font-bold">
                            {date.weekday}
                          </span>
                          <span className="text-[10px] font-black">
                            {date.day}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Format">
                    {availableFormats.map((format) => (
                      <FilterCheckbox
                        key={format.id}
                        label={format.name}
                        checked={filters.format.includes(format.slug)}
                        onChange={() => toggle("format", format.slug)}
                      />
                    ))}
                  </FilterSection>

                  <FilterSection title="Language">
                    {options.languages.map((language) => (
                      <FilterCheckbox
                        key={language.id}
                        label={language.name}
                        checked={filters.language.includes(language.slug)}
                        onChange={() => toggle("language", language.slug)}
                      />
                    ))}
                  </FilterSection>

                  <FilterSection title="Time of day">
                    {options.timeBands.map((band) => (
                      <FilterCheckbox
                        key={band.id}
                        label={band.label}
                        checked={filters.time.includes(band.id)}
                        onChange={() => toggle("time", band.id)}
                      />
                    ))}
                  </FilterSection>
                </div>
              ) : null}

              {!optionsQuery.isError && (
                <div className="mt-5 border-t border-white/8 pt-4">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold text-slate-200 hover:border-white/50 hover:text-white"
                    >
                      Clear All Filters
                    </button>
                  )}
                  <p className="mt-2 text-center text-[9px] text-slate-500">
                    {activeFilterCount} filters active
                  </p>
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-xs font-semibold text-slate-300"
                aria-live="polite"
              >
                {sessionsQuery.isSuccess && visibleSessionCount > 0
                  ? `Showing ${visibleSessionCount} sessions`
                  : sessionsQuery.isSuccess
                    ? "No sessions found"
                    : "Sessions"}
              </p>
              <label className="flex items-center gap-2 text-[10px] text-slate-400">
                Sort:
                <select
                  value={filters.sort}
                  disabled={!options || optionsQuery.isPending}
                  onChange={(event) =>
                    updateFilters({ sort: event.target.value })
                  }
                  className="max-w-56 rounded-md border border-white/10 bg-[#1c2030] px-2.5 py-2 text-[10px] font-bold text-white outline-none focus-visible:border-[#ff604c]"
                >
                  {(options?.sorts ?? []).map((sort) => (
                    <option key={sort.id} value={sort.id}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sessionsQuery.isPending || optionsQuery.isPending ? (
              <div className="space-y-6" aria-label="Loading sessions">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse border-b border-white/8 pb-5"
                  >
                    <div className="mb-4 h-12 w-48 rounded bg-white/8" />
                    <div className="flex gap-2 overflow-hidden">
                      {[0, 1, 2, 3].map((card) => (
                        <div
                          key={card}
                          className="h-20 min-w-40 rounded-lg bg-white/8"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : sessionsQuery.isError ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/3 px-5 py-5 text-sm text-slate-300">
                <span>Sessions could not be loaded.</span>
                <button
                  className="font-bold text-[#ff604c] hover:text-white"
                  onClick={() => void sessionsQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : visibleGroups.length === 0 ? (
              <div className="rounded-lg border border-white/8 bg-white/3 px-5 py-8 text-center">
                <p className="text-sm font-bold">No sessions found</p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-xs font-bold text-[#ff604c] hover:text-white"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  {visibleGroups.map(({ movie, sessions }) => (
                    <article
                      key={movie.id}
                      className="border-b border-white/8 pb-5 last:border-0"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <Link
                          to={`/movies/${movie.slug}`}
                          aria-label={`View ${movie.title}`}
                          className="h-12 w-8 shrink-0 overflow-hidden rounded bg-[#1c2030]"
                        >
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={`${movie.title} poster`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="grid h-full place-items-center text-[7px] text-slate-500">
                              No poster
                            </span>
                          )}
                        </Link>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/movies/${movie.slug}`}
                              className="truncate text-sm font-black hover:text-[#ff604c]"
                            >
                              {movie.title}
                            </Link>
                            <span className="rounded-full bg-[#f23a23]/15 px-2 py-1 text-[9px] font-bold text-[#ff604c]">
                              {movie.ageRating.code}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatRuntime(movie.runtimeMinutes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {sessions.map((session) => (
                          <SessionShowtime
                            key={session.id}
                            session={session}
                            onSelect={() =>
                              navigate(`/sessions/${session.id}/seats`, {
                                state: { backgroundLocation: location },
                              })
                            }
                          />
                        ))}
                      </div>
                    </article>
                  ))}
                </div>

                {pageCount > 1 && (
                  <nav
                    className="mt-7 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Session pages"
                  >
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={filters.page <= 1}
                      onClick={() =>
                        updateFilters({ page: filters.page - 1 }, false)
                      }
                      className="grid size-9 place-items-center rounded-full bg-[#1c2030] text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ‹
                    </button>
                    {Array.from(
                      { length: pageCount },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        aria-current={
                          filters.page === page ? "page" : undefined
                        }
                        onClick={() => updateFilters({ page }, false)}
                        className={`grid size-9 place-items-center rounded-full text-xs font-bold ${
                          filters.page === page
                            ? "bg-[#f23a23] text-white"
                            : "text-slate-300 hover:bg-white/8"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={filters.page >= pageCount}
                      onClick={() =>
                        updateFilters({ page: filters.page + 1 }, false)
                      }
                      className="grid size-9 place-items-center rounded-full bg-[#1c2030] text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ›
                    </button>
                    <span className="basis-full text-center text-[10px] text-slate-500">
                      Page {filters.page} of {pageCount}
                    </span>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/8 pb-4 last:border-b-0 last:pb-0">
      <h3 className="mb-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
