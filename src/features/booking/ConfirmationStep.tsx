import type { TicketOrder } from "../../api/tickets";

function formatPrice(value: number) {
  return `₾${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)}`;
}

export default function ConfirmationStep({
  order,
  onMyTickets,
  onClose,
}: {
  order: TicketOrder;
  onMyTickets: () => void;
  onClose: () => void;
}) {
  const { session } = order;
  const sessionDate = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${session.date}T12:00:00`));

  return (
    <section className="mx-auto max-w-2xl px-2 py-4 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-400 text-2xl font-black text-[#07101a]">
        ✓
      </span>
      <h2 className="mt-3 text-xl font-black">Booking confirmed!</h2>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
        Your tickets are ready. We’ve sent the confirmation to your email.
      </p>
      <p className="mx-auto mt-3 w-fit rounded-full bg-[#292c3d] px-4 py-1.5 text-[10px] font-bold">
        ORDER #{order.reference}
      </p>

      <div className="mt-5 rounded-lg bg-[#1d2030] p-4 text-left">
        <div className="flex items-center gap-3 border-b border-white/8 pb-3">
          {session.movie.posterUrl ? (
            <img
              src={session.movie.posterUrl}
              alt=""
              className="h-14 w-10 rounded object-cover"
            />
          ) : null}
          <div>
            <h3 className="text-sm font-black">{session.movie.title}</h3>
            <p className="mt-1 text-[10px] text-slate-400">
              {session.venue.name} · Hall {session.hall.name} · {sessionDate} ·{" "}
              {session.time}
            </p>
          </div>
        </div>
        <div className="space-y-2 border-b border-white/8 py-3 text-[10px]">
          {order.tickets.map((ticket) => (
            <div key={ticket.id} className="flex justify-between gap-3">
              <span className="text-slate-300">
                {ticket.seatCode} · {ticket.ticketType.name}
              </span>
              <span>{formatPrice(ticket.price)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-3 text-[10px] font-bold uppercase">
          <span>Total paid</span>
          <span className="text-base normal-case">
            {formatPrice(order.totalPrice)}
          </span>
        </div>
        <p className="mt-2 text-right text-[9px] text-slate-500">
          Card ending in {order.cardLastFour}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onMyTickets}
          className="rounded-full bg-[#f23a1b] px-5 py-2.5 text-[11px] font-bold text-white hover:bg-[#d92e1a]"
        >
          My Tickets
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/8 px-5 py-2.5 text-[11px] font-bold text-white hover:bg-white/12"
        >
          Close
        </button>
      </div>
    </section>
  );
}
