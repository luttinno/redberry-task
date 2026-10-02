import type { FilterOptions } from "../../api/filterOptions";

export interface SessionFilterState {
  venue: string[];
  date: string;
  format: string[];
  language: string[];
  time: string[];
  sort: string;
  page: number;
}

export function getNextSevenDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const value = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      value,
      weekday: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    };
  });
}

function values(params: URLSearchParams, key: string) {
  return [...new Set((params.get(key) ?? "").split(",").filter(Boolean))];
}

function validValues(input: string[], allowed: string[] | undefined) {
  return allowed ? input.filter((value) => allowed.includes(value)) : input;
}

export function getAvailableFormats(
  options: FilterOptions,
  venueSlugs: string[],
) {
  if (!venueSlugs.length) return options.formats;
  const availableSlugs = new Set(
    options.venues
      .filter((venue) => venueSlugs.includes(venue.slug))
      .flatMap((venue) => venue.formats.map((format) => format.slug)),
  );
  return options.formats.filter((format) => availableSlugs.has(format.slug));
}

export function getDefaultSort(options?: FilterOptions) {
  return (
    options?.sorts.find((sort) => sort.id === "time_asc")?.id ??
    options?.sorts[0]?.id ??
    "time_asc"
  );
}

export function parseSessionFilters(
  params: URLSearchParams,
  options?: FilterOptions,
): SessionFilterState {
  const venue = validValues(
    values(params, "venue"),
    options?.venues.map((item) => item.slug),
  );
  const allowedFormats = options
    ? getAvailableFormats(options, venue).map((item) => item.slug)
    : undefined;
  const dates = getNextSevenDates();
  const requestedDate = params.get("date") ?? "";
  const date = dates.some((item) => item.value === requestedDate)
    ? requestedDate
    : dates[0].value;
  const requestedSort = params.get("sort") ?? "";
  const allowedSorts = options?.sorts.map((item) => item.id);
  const sort =
    requestedSort && (!allowedSorts || allowedSorts.includes(requestedSort))
      ? requestedSort
      : getDefaultSort(options);
  const requestedPage = Number(params.get("page"));

  return {
    venue,
    date,
    format: validValues(
      values(params, "format"),
      allowedFormats ?? options?.formats.map((item) => item.slug),
    ),
    language: validValues(
      values(params, "language"),
      options?.languages.map((item) => item.slug),
    ),
    time: validValues(
      values(params, "time"),
      options?.timeBands.map((item) => item.id),
    ),
    sort,
    page:
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
}

export function serializeSessionFilters(filters: SessionFilterState) {
  const params = new URLSearchParams();
  if (filters.venue.length) params.set("venue", filters.venue.join(","));
  params.set("date", filters.date);
  if (filters.format.length) params.set("format", filters.format.join(","));
  if (filters.language.length)
    params.set("language", filters.language.join(","));
  if (filters.time.length) params.set("time", filters.time.join(","));
  params.set("sort", filters.sort);
  params.set("page", String(filters.page));
  return params;
}
