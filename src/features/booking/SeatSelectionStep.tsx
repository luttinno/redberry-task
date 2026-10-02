import type { FilterOptions } from "../../api/filterOptions";
import { Spinner } from "../../components/ui/Spinner";
import type { BookingSeat, SeatMap } from "./types";

type TicketType = FilterOptions["ticketTypes"][number];

function formatPrice(value: number) {
  return `₾${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)}`;
}

function ticketBlocked(ticket: TicketType, ratingAge: number) {
  return (
    ticket.blockedFromRatingAge !== null &&
    ratingAge >= ticket.blockedFromRatingAge
  );
}

export default function SeatSelectionStep({
  seatMap,
  ticketTypes,
  selected,
  contestedCodes,
  sessionPrice,
  ratingAge,
  maxSeats,
  busy,
  notice,
  onToggleSeat,
  onChangeTicket,
  onContinue,
}: {
  seatMap: SeatMap;
  ticketTypes: TicketType[];
  selected: Record<number, string>;
  contestedCodes: string[];
  sessionPrice: number;
  ratingAge: number;
  maxSeats: number;
  busy: boolean;
  notice: string;
  onToggleSeat: (seat: BookingSeat) => void;
  onChangeTicket: (seatId: number, ticketTypeSlug: string) => void;
  onContinue: () => void;
}) {
  const contested = new Set(contestedCodes);
  const availableTickets = ticketTypes.filter(
    (ticket) => !ticketBlocked(ticket, ratingAge),
  );
  const selectedSeats = seatMap.sections.flatMap((section) =>
    section.rows.flatMap((row) =>
      row.seats
        .filter((seat) => selected[seat.id])
        .map((seat) => ({ seat, section: section.name })),
    ),
  );
  const summary = selectedSeats.map(({ seat, section }) => {
    const ticket = ticketTypes.find((item) => item.slug === selected[seat.id]);
    return {
      seat,
      section,
      ticket,
      price: ticket ? sessionPrice * ticket.priceRatio : 0,
    };
  });
  const invalidSeats = summary.filter(
    ({ ticket }) => !ticket || ticketBlocked(ticket, ratingAge),
  );
  const subtotal = summary.reduce((total, item) => total + item.price, 0);
  const adultSlug = ticketTypes.find((ticket) => ticket.slug === "adult")?.slug;

  return (
    <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="min-w-0">
        <div className="mb-4 rounded-full bg-[#292c3d] py-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-200">
          Screen
        </div>
        <div className="max-h-[48vh] space-y-5 overflow-auto pr-1">
          {seatMap.sections.map((section) => (
            <section key={section.name}>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.name}
              </h3>
              <div className="space-y-2">
                {section.rows.map((row) => (
                  <div
                    key={`${section.name}-${row.label}`}
                    className="flex min-w-max items-center gap-2"
                  >
                    <span className="w-5 shrink-0 text-center text-[10px] font-bold text-slate-300">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {row.seats.map((seat) => {
                        const isSelected = Boolean(selected[seat.id]);
                        const isContested = contested.has(seat.code);
                        const state = isContested ? "sold" : seat.state;
                        const selectable =
                          !isContested &&
                          (state === "available" || seat.isMine);
                        const className = isSelected
                          ? "border-[#f23a23] bg-[#f23a23] text-white"
                          : state === "available"
                            ? "border-[#414456] bg-[#202333] text-slate-100 hover:border-white/60"
                            : state === "held"
                              ? "seat-held border-[#36394a] text-slate-400"
                              : "border-transparent bg-[#171a29] text-slate-600";
                        return (
                          <span
                            key={seat.id}
                            className="inline-flex items-center gap-1.5"
                          >
                            {state === "unavailable" ? (
                              <span
                                className="size-9 shrink-0"
                                aria-label="Unavailable seat gap"
                              />
                            ) : (
                              <button
                                type="button"
                                disabled={!selectable || busy}
                                aria-label={`${seat.code}, ${isSelected ? "selected" : state}`}
                                aria-pressed={isSelected}
                                onClick={() => onToggleSeat(seat)}
                                className={`grid size-9 shrink-0 place-items-center rounded-md border text-[11px] font-bold transition disabled:cursor-not-allowed ${className}`}
                              >
                                {seat.label}
                              </button>
                            )}
                            {seat.aisleAfter && (
                              <span className="w-2 shrink-0" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-slate-400">
          <LegendSwatch label="Available" className="bg-[#202333]" />
          <LegendSwatch label="Selected" className="bg-[#f23a1b]" />
          <LegendSwatch label="Sold" className="bg-[#171a29]" />
          <LegendSwatch label="Held by another user" className="seat-held" />
          <LegendSwatch label="Unavailable" className="bg-transparent" />
        </div>
      </section>

      <aside className="flex min-h-0 flex-col border-t border-white/8 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div className="mb-3">
          <h3 className="text-sm font-black">Your seats · Max {maxSeats}</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">
            Pick up to {maxSeats} seats. Each seat can have its own ticket type.
          </p>
        </div>
        {notice && (
          <p
            className="mb-3 rounded-md bg-amber-500/10 px-3 py-2 text-[10px] leading-4 text-amber-200"
            role="status"
          >
            {notice}
          </p>
        )}
        {invalidSeats.map(({ seat, ticket }) => (
          <p
            key={seat.id}
            className="mb-2 text-[10px] text-rose-300"
            role="alert"
          >
            Seat {seat.code}:{" "}
            {ticket?.note ?? "Select an eligible ticket type."}
          </p>
        ))}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {summary.map(({ seat, section, price }) => (
            <div key={seat.id} className="rounded-lg bg-[#1d2030] p-3">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-400">
                  Seat <strong className="ml-1 text-white">{seat.code}</strong>
                </span>
                <strong>{formatPrice(price)}</strong>
                <button
                  type="button"
                  aria-label={`Remove seat ${seat.code}`}
                  onClick={() => onToggleSeat(seat)}
                  className="text-slate-500 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-[9px] text-slate-500">
                  {section}
                </span>
                <select
                  aria-label={`Ticket type for seat ${seat.code}`}
                  value={selected[seat.id] ?? adultSlug ?? ""}
                  onChange={(event) =>
                    onChangeTicket(seat.id, event.target.value)
                  }
                  className="max-w-36 rounded-full bg-[#2a2d3e] px-2 py-1.5 text-[9px] text-white outline-none focus-visible:ring-1 focus-visible:ring-[#ff604c]"
                >
                  {availableTickets.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name} · {Math.round(item.priceRatio * 100)}%
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {summary.length === 0 && (
            <p className="rounded-lg bg-[#1d2030] px-3 py-4 text-[10px] text-slate-500">
              No seats selected yet.
            </p>
          )}
        </div>
        <div className="mt-4 border-t border-white/8 pt-3">
          <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide">
            <span>Subtotal</span>
            <span className="text-base normal-case">
              {formatPrice(subtotal)}
            </span>
          </div>
          <button
            type="button"
            disabled={summary.length === 0 || invalidSeats.length > 0 || busy}
            onClick={onContinue}
            className="w-full rounded-full bg-[#f23a1b] px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#d92e1a] disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-slate-300"
          >
            {busy && <Spinner label="Holding seats" />}
            {busy ? "Holding seats…" : "Next: Checkout"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function LegendSwatch({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`size-3 rounded-sm border border-white/15 ${className}`}
      />
      {label}
    </span>
  );
}
