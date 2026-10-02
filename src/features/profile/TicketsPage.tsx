import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { Modal } from "../../components/ui/Modal";
import { ApiError } from "../../api/client";
import type { TicketFilter, TicketOrder } from "../../api/tickets";
import { useAuth } from "../auth/context/useAuth";
import { useRefundOrder, useTickets } from "./useTickets";

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function TicketCard({
  order,
  onRefund,
}: {
  order: TicketOrder;
  onRefund: (order: TicketOrder) => void;
}) {
  const { movie, venue, hall, format, language } = order.session;
  return (
    <article className="grid overflow-hidden rounded-xl bg-[#1c2030] md:grid-cols-[minmax(0,1fr)_250px]">
      <div className="grid gap-4 p-4 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-5 sm:p-6">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="aspect-2/3 w-full rounded-lg object-cover sm:w-25"
          />
        ) : (
          <div className="grid aspect-2/3 w-full place-items-center rounded-lg bg-[#292e40] text-xs text-slate-500 sm:w-25">
            Poster unavailable
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/movies/${movie.slug}`}
              className="text-base font-black text-white hover:text-[#ff604c]"
            >
              {movie.title}
            </Link>
            <span className="rounded-full bg-[#f23a23]/15 px-2 py-1 text-[10px] font-bold text-[#ff604c]">
              {movie.ageRating.code}
            </span>
            <span className="text-xs text-slate-400">
              {movie.runtimeMinutes} min
            </span>
          </div>
          <dl className="mt-5 grid gap-x-6 gap-y-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Date
              </dt>
              <dd className="mt-1 font-semibold text-slate-100">
                {formatSessionDate(order.session.date)} · {order.session.time}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Venue
              </dt>
              <dd className="mt-1 font-semibold text-slate-100">
                {venue.name} · Hall {hall.name}
              </dd>
              <dd className="mt-1 text-slate-400">{venue.city}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Format
              </dt>
              <dd className="mt-1 font-semibold text-slate-100">
                {format.name}
              </dd>
              <dd className="mt-1 text-slate-400">{language.name}</dd>
            </div>
          </dl>
          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Seats and ticket types"
          >
            {order.tickets.map((ticket) => (
              <span
                key={ticket.id}
                className="rounded bg-[#343849] px-2.5 py-1.5 text-[11px] font-semibold text-white"
              >
                {ticket.seatCode} · {ticket.ticketType.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <aside className="flex flex-col justify-center border-t border-white/8 px-5 py-4 md:border-l md:border-t-0 md:px-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Order
        </p>
        <p className="mt-1 text-sm font-bold">#{order.reference}</p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <span className="text-xs text-slate-400">Total paid</span>
          <strong className="text-2xl">₾{order.totalPrice}</strong>
        </div>
        {order.isUpcoming && (
          <>
            <button
              type="button"
              disabled={!order.isRefundable}
              title={
                !order.isRefundable
                  ? "Refund is no longer available for this session."
                  : undefined
              }
              onClick={() => onRefund(order)}
              className="mt-4 h-10 rounded-full bg-[#343849] text-xs font-bold text-white transition hover:bg-[#41475c] disabled:cursor-not-allowed disabled:text-slate-500"
            >
              Refund
            </button>
            {!order.isRefundable && (
              <p className="mt-2 text-center text-[10px] text-slate-500">
                Refund is no longer available.
              </p>
            )}
          </>
        )}
      </aside>
    </article>
  );
}

export default function TicketsPage() {
  const { user, status, requireAuth, openAuth } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TicketFilter>("upcoming");
  const [confirmOrder, setConfirmOrder] = useState<TicketOrder | null>(null);
  const [refundError, setRefundError] = useState("");
  const refundMutation = useRefundOrder();
  const tickets = useTickets(filter, status === "authenticated");
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status === "guest") requireAuth(() => navigate("/tickets"));
  }, [navigate, requireAuth, status]);

  useEffect(() => {
    if (!confirmOrder) return;
    cancelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !refundMutation.isPending) {
        setConfirmOrder(null);
        setRefundError("");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmOrder, refundMutation.isPending]);

  const onSearchSubmit = () => navigate("/", { state: { search } });
  const confirmRefund = () => {
    if (!confirmOrder || refundMutation.isPending) return;
    const orderId = confirmOrder.id;
    setRefundError("");
    requireAuth(async () => {
      try {
        await refundMutation.mutateAsync(orderId);
        setConfirmOrder(null);
        toast.success("Refund processed successfully.");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) throw error;
        setRefundError(
          error instanceof Error
            ? error.message
            : "The refund could not be processed.",
        );
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#070c1c] text-white">
      <SiteHeader
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={onSearchSubmit}
      />
      <div className="mx-auto w-full max-w-375 flex-1 px-6 pb-12 pt-4 sm:px-10 lg:px-12">
        <h1 className="text-lg font-black">My Profile</h1>
        <nav
          className="mt-4 flex gap-6 border-b border-white/8"
          aria-label="Profile sections"
        >
          <NavLink
            to="/profile"
            end
            className={({ isActive }) =>
              `relative pb-3 text-[10px] font-medium ${isActive ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#f23a23]" : "text-slate-400 hover:text-white"}`
            }
          >
            Personal Information
          </NavLink>
          <NavLink
            to="/tickets"
            className={({ isActive }) =>
              `relative pb-3 text-[10px] font-medium ${isActive ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#f23a23]" : "text-slate-400 hover:text-white"}`
            }
          >
            My Tickets
          </NavLink>
        </nav>

        <section className="pt-7" aria-labelledby="tickets-heading">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 id="tickets-heading" className="text-base font-black">
              Tickets
            </h2>
            <div
              className="flex rounded-full bg-[#191d2b] p-1"
              role="tablist"
              aria-label="Ticket history"
            >
              {(["upcoming", "past"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab}
                  className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${filter === tab ? "bg-[#f23a23] text-white" : "text-slate-400 hover:text-white"}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {status === "guest" ? (
            <div className="rounded-lg border border-white/8 bg-white/3 px-6 py-12 text-center">
              <p className="text-sm font-bold">Sign in to view your tickets</p>
              <button
                type="button"
                className="mt-5 rounded-full bg-[#f23a23] px-4 py-2 text-xs font-bold hover:bg-[#d92e1a]"
                onClick={() => openAuth("login")}
              >
                Log in
              </button>
            </div>
          ) : status === "loading" || (user && tickets.isPending) ? (
            <div className="grid gap-4" aria-label="Loading tickets">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-xl bg-[#1c2030]"
                />
              ))}
            </div>
          ) : tickets.isError ? (
            <ErrorState
              message={
                tickets.error.message || "We couldn’t load your tickets."
              }
              onRetry={() => void tickets.refetch()}
            />
          ) : tickets.data?.length ? (
            <div className="grid gap-4">
              {tickets.data.map((order) => (
                <TicketCard
                  key={order.id}
                  order={order}
                  onRefund={(item) => {
                    setRefundError("");
                    setConfirmOrder(item);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/8 bg-white/3 px-6 py-12 text-center">
              <p className="text-sm font-bold">No {filter} tickets</p>
              <p className="mt-2 text-xs text-slate-400">
                {filter === "upcoming"
                  ? "Your next cinema visit will appear here."
                  : "Your past bookings will appear here."}
              </p>
              <Link
                to="/sessions"
                className="mt-5 inline-flex rounded-full bg-[#f23a23] px-4 py-2 text-xs font-bold hover:bg-[#d92e1a]"
              >
                Browse sessions
              </Link>
            </div>
          )}
        </section>
      </div>
      <SiteFooter />

      {confirmOrder && (
        <Modal
          onClose={() => {
            if (!refundMutation.isPending) {
              setConfirmOrder(null);
              setRefundError("");
            }
          }}
          backdropClassName="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#0d1222] p-6 shadow-2xl"
          ariaLabelledBy="refund-title"
          closeButton={
            <button
              type="button"
              aria-label="Close refund confirmation"
              disabled={refundMutation.isPending}
              className="absolute right-4 top-4 text-xl leading-none text-slate-400 hover:text-white disabled:opacity-50"
              onClick={() => {
                setConfirmOrder(null);
                setRefundError("");
              }}
            >
              ×
            </button>
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="refund-title" className="text-lg font-black">
                Refund tickets?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Refund order {confirmOrder.reference} for{" "}
                {confirmOrder.tickets
                  .map((ticket) => ticket.seatCode)
                  .join(", ")}
                ?
              </p>
            </div>
          </div>
          {refundError && (
            <p role="alert" className="mt-4 text-xs text-[#ff604c]">
              {refundError}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              disabled={refundMutation.isPending}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20 disabled:opacity-50"
              onClick={() => setConfirmOrder(null)}
            >
              Keep tickets
            </button>
            <button
              type="button"
              disabled={refundMutation.isPending}
              className="rounded-full bg-[#f23a23] px-4 py-2 text-xs font-bold hover:bg-[#d92e1a] disabled:opacity-50"
              onClick={() => void confirmRefund()}
            >
              {refundMutation.isPending ? "Processing…" : "Confirm refund"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
