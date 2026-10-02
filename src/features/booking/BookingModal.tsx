import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { bookingApi } from "../../api/booking";
import type { TicketOrder } from "../../api/tickets";
import { mapApiErrors } from "../forms/mapApiErrors";
import { useAuth } from "../auth/context/useAuth";
import { useFilterOptions } from "../sessions/useFilterOptions";
import CheckoutStep from "./CheckoutStep";
import { checkoutSchema, type CheckoutValues } from "./checkoutSchema";
import ConfirmationStep from "./ConfirmationStep";
import SeatSelectionStep from "./SeatSelectionStep";
import type { BookingSeat, SeatHold } from "./types";
import {
  useBookingSeats,
  useBookingSession,
  useCreateOrder,
  useCreateSeatHold,
} from "./useBooking";

type Step = "seats" | "checkout" | "confirmation";

function holdStorageKey(sessionId: number) {
  return `kino-xii:hold:${sessionId}`;
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to complete the request.";
}

export default function BookingModal() {
  const { sessionId: sessionIdParam = "" } = useParams();
  const sessionId = Number(sessionIdParam);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, status, token, modal: authModal, requireAuth } = useAuth();
  const optionsQuery = useFilterOptions();
  const accessGranted =
    status === "authenticated" && Boolean(user?.profileComplete);
  const [step, setStep] = useState<Step>("seats");
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [contestedCodes, setContestedCodes] = useState<string[]>([]);
  const [seatNotice, setSeatNotice] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [hold, setHold] = useState<SeatHold | null>(null);
  const [order, setOrder] = useState<TicketOrder | null>(null);
  const [clock, setClock] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [handledExpiration, setHandledExpiration] = useState<string | null>(
    null,
  );
  const dialogRef = useRef<HTMLElement>(null);
  const holdLock = useRef(false);
  const paymentLock = useRef(false);
  const activeHoldId = useRef<string | null>(null);
  const restoreAttemptedToken = useRef<string | null>(null);
  const orderMutation = useCreateOrder();
  const holdMutation = useCreateSeatHold(sessionId);
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    },
  });

  useEffect(() => {
    if (status === "guest") {
      requireAuth(() => undefined, {
        requiresCompleteProfile: true,
      });
    }
  }, [requireAuth, status]);

  const sessionQuery = useBookingSession(sessionId, accessGranted);
  const session = sessionQuery.data;
  const ageRestricted = Boolean(
    session &&
    user &&
    (user.age === null
      ? session.movie.ageRating.minAge > 0
      : user.age < session.movie.ageRating.minAge),
  );
  const seatsEnabled = Boolean(
    accessGranted &&
    optionsQuery.isSuccess &&
    sessionQuery.isSuccess &&
    !ageRestricted &&
    !session?.isSoldOut,
  );
  const seatsQuery = useBookingSeats(sessionId, seatsEnabled);
  const seatMap = seatsQuery.data;
  const options = optionsQuery.data;
  const adultSlug = options?.ticketTypes.find(
    (ticket) => ticket.slug === "adult",
  )?.slug;
  const mineSelectionEntries = adultSlug
    ? (seatMap?.sections ?? [])
        .flatMap((section) => section.rows)
        .flatMap((row) => row.seats)
        .filter((seat) => seat.isMine && selected[seat.id] === undefined)
        .map((seat) => [seat.id, adultSlug] as const)
    : [];
  const selectedForDisplay: Record<number, string> = {
    ...Object.fromEntries(mineSelectionEntries),
    ...selected,
  };
  const expirationMs = hold ? Date.parse(hold.expiresAt) : 0;
  const remainingSeconds = hold
    ? Math.max(0, Math.ceil((expirationMs - clock) / 1000))
    : 0;

  useEffect(() => {
    if (!user) return;
    form.reset({
      fullName: user.fullName ?? "",
      email: user.email,
      mobileNumber: user.mobileNumber ?? "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    });
  }, [form, user]);

  useEffect(() => {
    if (!hold) {
      activeHoldId.current = null;
      return;
    }
    activeHoldId.current = hold.isLive ? hold.holdId : null;
  }, [hold]);

  useEffect(() => {
    if (!accessGranted || !token || restoreAttemptedToken.current === token) {
      return;
    }
    restoreAttemptedToken.current = token;
    const savedHoldId = sessionStorage.getItem(holdStorageKey(sessionId));
    if (!savedHoldId) return;

    let cancelled = false;
    void bookingApi
      .getHold(savedHoldId)
      .then((restored) => {
        if (cancelled) return;
        if (!("holdId" in restored) || !restored.isLive) {
          sessionStorage.removeItem(holdStorageKey(sessionId));
          setSeatNotice("Your hold time expired. Please re-select your seats.");
          return;
        }
        if (restored.sessionId !== sessionId) {
          sessionStorage.removeItem(holdStorageKey(sessionId));
          return;
        }
        setHold(restored);
        setClock(Date.now());
        setSelected(
          Object.fromEntries(
            restored.seats.map((seat) => [seat.seatId, seat.ticketType.slug]),
          ),
        );
        setStep("checkout");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (
          error instanceof ApiError &&
          (error.status === 403 || error.status === 404)
        ) {
          sessionStorage.removeItem(holdStorageKey(sessionId));
        }
        setSeatNotice(getErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [accessGranted, sessionId, token]);

  useEffect(
    () => () => {
      const holdId = activeHoldId.current;
      if (holdId) void bookingApi.releaseHold(holdId).catch(() => undefined);
    },
    [],
  );

  const expireHold = useCallback(
    (message = "Your hold time expired. Please re-select your seats.") => {
      if (hold && handledExpiration === hold.holdId) return;
      if (hold) setHandledExpiration(hold.holdId);
      sessionStorage.removeItem(holdStorageKey(sessionId));
      setHold(null);
      setSelected({});
      setContestedCodes([]);
      setStep("seats");
      setCheckoutNotice("");
      setSeatNotice(message);
      void seatsQuery.refetch();
    },
    [handledExpiration, hold, seatsQuery, sessionId],
  );

  useEffect(() => {
    if (!hold) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      if (Date.parse(hold.expiresAt) <= now) expireHold();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expireHold, hold]);

  const closeModal = useCallback(async () => {
    if (
      isClosing ||
      isHolding ||
      isPaying ||
      holdMutation.isPending ||
      orderMutation.isPending
    ) {
      return;
    }
    setIsClosing(true);
    const holdId = activeHoldId.current;
    activeHoldId.current = null;
    sessionStorage.removeItem(holdStorageKey(sessionId));
    if (holdId) {
      try {
        await bookingApi.releaseHold(holdId);
      } catch {
        // A live hold will expire on the server if release fails.
      }
    }
    if (location.state && "backgroundLocation" in location.state) {
      navigate(-1);
    } else {
      navigate("/sessions", { replace: true });
    }
  }, [
    holdMutation.isPending,
    isClosing,
    isHolding,
    isPaying,
    location.state,
    navigate,
    orderMutation.isPending,
    sessionId,
  ]);

  useEffect(() => {
    if (!accessGranted || !session) return;
    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
    );
    focusable?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void closeModal();
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]",
      );
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [accessGranted, closeModal, hold?.holdId, session, step]);

  const toggleSeat = (seat: BookingSeat) => {
    const selectedTicket = selectedForDisplay[seat.id];
    if (selectedTicket) {
      setSelected((current) => {
        const next = { ...current };
        if (current[seat.id] === undefined && seat.isMine) {
          next[seat.id] = "";
        } else {
          delete next[seat.id];
        }
        return next;
      });
      return;
    }
    const maxSeats = options?.maxSeatsPerOrder ?? 0;
    if (Object.values(selectedForDisplay).filter(Boolean).length >= maxSeats) {
      setSeatNotice(`You can select up to ${maxSeats} seats per order.`);
      return;
    }
    if (!adultSlug) {
      setSeatNotice("Ticket options are unavailable. Please try again.");
      return;
    }
    setSeatNotice("");
    setSelected((current) => ({ ...current, [seat.id]: adultSlug }));
  };

  const reconcileContested = (codes: string[], message: string) => {
    const lostCodes = new Set(codes);
    const lostIds = new Set(
      (seatMap?.sections ?? [])
        .flatMap((section) => section.rows)
        .flatMap((row) => row.seats)
        .filter((seat) => lostCodes.has(seat.code))
        .map((seat) => seat.id),
    );
    setSelected((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([seatId]) => !lostIds.has(Number(seatId)),
        ),
      ),
    );
    setContestedCodes(codes);
    setSeatNotice(
      codes.length
        ? `${message} Lost seats: ${codes.join(", ")}. They were removed; the remaining selection is preserved.`
        : message,
    );
    setStep("seats");
    void seatsQuery.refetch();
  };

  const requestHold = () => {
    if (!options || !session || holdLock.current) return;
    holdLock.current = true;
    const seats = Object.entries(selectedForDisplay)
      .filter(([, ticketType]) => Boolean(ticketType))
      .map(([seatId, ticketType]) => ({
        seatId: Number(seatId),
        ticketType,
      }));
    if (seats.length === 0 || seats.length > options.maxSeatsPerOrder) {
      holdLock.current = false;
      return;
    }

    requireAuth(
      async () => {
        setIsHolding(true);
        setSeatNotice("");
        try {
          const nextHold = await holdMutation.mutateAsync(seats);
          sessionStorage.setItem(holdStorageKey(sessionId), nextHold.holdId);
          setHandledExpiration(null);
          setHold(nextHold);
          setClock(Date.now());
          setCheckoutNotice("");
          setStep("checkout");
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) throw error;
          if (error instanceof ApiError && error.status === 409) {
            reconcileContested(
              error.contested ?? [],
              error.message || "Some selected seats are no longer available.",
            );
          } else {
            setSeatNotice(getErrorMessage(error));
          }
        } finally {
          holdLock.current = false;
          setIsHolding(false);
        }
      },
      { requiresCompleteProfile: true },
    );
  };

  const processOrder = async (values: CheckoutValues) => {
    if (!hold || isPaying || orderMutation.isPending) return;
    requireAuth(
      async () => {
        setIsPaying(true);
        setCheckoutNotice("");
        try {
          const completedOrder = await orderMutation.mutateAsync({
            holdId: hold.holdId,
            ...values,
          });
          sessionStorage.removeItem(holdStorageKey(sessionId));
          setOrder(completedOrder);
          setHold(null);
          setSelected({});
          setStep("confirmation");
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) throw error;
          if (error instanceof ApiError && error.status === 409) {
            if (error.contested?.length) {
              reconcileContested(error.contested, error.message);
            } else {
              setCheckoutNotice(error.message);
            }
          } else if (
            error instanceof ApiError &&
            error.status === 422 &&
            !error.errors
          ) {
            expireHold(error.message);
          } else {
            setCheckoutNotice(
              mapApiErrors(error, form.setError, {
                fullName: "fullName",
                email: "email",
                mobileNumber: "mobileNumber",
                cardNumber: "cardNumber",
                expiry: "expiry",
                cvv: "cvv",
              }),
            );
          }
        } finally {
          setIsPaying(false);
        }
      },
      { requiresCompleteProfile: true },
    );
  };

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    if (paymentLock.current) {
      event.preventDefault();
      return;
    }
    paymentLock.current = true;
    void form
      .handleSubmit(processOrder)(event)
      .finally(() => {
        paymentLock.current = false;
      });
  };

  const closeAccessGate = () => {
    if (location.state && "backgroundLocation" in location.state) {
      navigate(-1);
    } else {
      navigate("/sessions", { replace: true });
    }
  };

  if (status === "loading") {
    return (
      <AccessPanel title="Restoring your account…" onClose={closeAccessGate} />
    );
  }
  if (status !== "authenticated" || !user) {
    if (authModal) return null;
    return (
      <AccessPanel
        title="Sign in to select seats"
        description="Your session selection will continue after you sign in."
        actionLabel="Log in"
        onAction={() =>
          requireAuth(() => undefined, { requiresCompleteProfile: true })
        }
        onClose={closeAccessGate}
      />
    );
  }
  if (!user.profileComplete) {
    return (
      <AccessPanel
        title="Complete your profile to book"
        description="Booking requires your full name, mobile number, and date of birth."
        onClose={closeAccessGate}
      >
        <Link
          to="/profile"
          state={{
            returnTo: `/sessions/${sessionId}/seats`,
            backgroundLocation: (
              location.state as { backgroundLocation?: unknown } | null
            )?.backgroundLocation,
          }}
          className="rounded-full bg-[#f23a1b] px-5 py-2.5 text-[11px] font-bold text-white"
        >
          Complete profile
        </Link>
      </AccessPanel>
    );
  }
  if (!accessGranted) {
    return <AccessPanel title="Preparing booking…" onClose={closeAccessGate} />;
  }

  if (optionsQuery.isError) {
    return (
      <BookingShell
        onClose={closeModal}
        dialogRef={dialogRef}
        title="Booking unavailable"
      >
        <ErrorPanel
          message="Booking options could not be loaded."
          onRetry={() => void optionsQuery.refetch()}
        />
      </BookingShell>
    );
  }
  if (optionsQuery.isPending || sessionQuery.isPending) {
    return (
      <BookingShell
        onClose={closeModal}
        dialogRef={dialogRef}
        title="Loading session…"
      >
        <div className="h-72 animate-pulse rounded-lg bg-white/5" />
      </BookingShell>
    );
  }
  if (sessionQuery.isError || !session) {
    return (
      <BookingShell
        onClose={closeModal}
        dialogRef={dialogRef}
        title="Session unavailable"
      >
        <ErrorPanel
          message={
            sessionQuery.error instanceof ApiError &&
            sessionQuery.error.status === 404
              ? "This session could not be found."
              : "Session information could not be loaded."
          }
          onRetry={() => void sessionQuery.refetch()}
        />
      </BookingShell>
    );
  }

  if (ageRestricted) {
    return (
      <BookingShell
        onClose={closeModal}
        dialogRef={dialogRef}
        title={session.movie.title}
      >
        <p
          className="rounded-lg bg-amber-500/10 p-5 text-sm leading-6 text-amber-200"
          role="alert"
        >
          This film is rated {session.movie.ageRating.code}. You cannot buy
          tickets for it with this account.
        </p>
      </BookingShell>
    );
  }
  if (session.isSoldOut) {
    return (
      <BookingShell
        onClose={closeModal}
        dialogRef={dialogRef}
        title={session.movie.title}
      >
        <p
          className="rounded-lg bg-white/5 p-5 text-sm text-slate-300"
          role="status"
        >
          This session is sold out.
        </p>
      </BookingShell>
    );
  }

  const dateLabel = formatSessionDate(session.date);
  const header = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-black" id="booking-dialog-title">
          {session.movie.title}
        </h2>
        <p className="mt-1 truncate text-[10px] text-slate-400">
          {session.venue.name} · Hall {session.hall.name} · {dateLabel} ·{" "}
          {session.time} · {session.format.name} · {session.language.name}
        </p>
      </div>
      <div className="flex min-w-48 overflow-hidden rounded-full bg-[#202232] text-[9px] font-bold">
        <span
          className={`flex-1 px-4 py-2 text-center ${step === "seats" ? "bg-[#f23a1b] text-white" : "text-slate-400"}`}
        >
          1. Seats
        </span>
        <span
          className={`flex-1 px-4 py-2 text-center ${step === "checkout" ? "bg-[#f23a1b] text-white" : "text-slate-400"}`}
        >
          2. Checkout
        </span>
      </div>
      {hold && step !== "confirmation" && (
        <div className="rounded-md bg-[#202232] px-3 py-2 text-center">
          <span className="block text-[8px] font-bold uppercase text-slate-400">
            Hold timer · {options?.holdMinutes} min
          </span>
          <span className="text-xs font-black tabular-nums">
            {Math.floor(remainingSeconds / 60)}:
            {String(remainingSeconds % 60).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <BookingShell
      onClose={closeModal}
      dialogRef={dialogRef}
      title={session.movie.title}
      header={header}
      isClosing={
        isClosing ||
        isHolding ||
        isPaying ||
        holdMutation.isPending ||
        orderMutation.isPending
      }
    >
      {step === "confirmation" && order ? (
        <ConfirmationStep
          order={order}
          onMyTickets={() => navigate("/tickets")}
          onClose={closeModal}
        />
      ) : step === "checkout" && hold ? (
        <CheckoutStep
          hold={hold}
          form={form}
          busy={isPaying || orderMutation.isPending}
          error={checkoutNotice}
          remainingSeconds={remainingSeconds}
          onBack={() => setStep("seats")}
          onSubmit={submitOrder}
        />
      ) : seatsQuery.isPending || !options ? (
        <div className="h-72 animate-pulse rounded-lg bg-white/5" />
      ) : seatsQuery.isError || !seatMap ? (
        <ErrorPanel
          message="The seat map could not be loaded."
          onRetry={() => void seatsQuery.refetch()}
        />
      ) : (
        <SeatSelectionStep
          seatMap={seatMap}
          ticketTypes={options.ticketTypes}
          selected={selectedForDisplay}
          contestedCodes={contestedCodes}
          sessionPrice={session.price}
          ratingAge={session.movie.ageRating.minAge}
          maxSeats={options.maxSeatsPerOrder}
          busy={isHolding || holdMutation.isPending}
          notice={seatNotice}
          onToggleSeat={toggleSeat}
          onChangeTicket={(seatId, ticketType) =>
            setSelected((current) => ({ ...current, [seatId]: ticketType }))
          }
          onContinue={requestHold}
        />
      )}
    </BookingShell>
  );
}

function BookingShell({
  title,
  header,
  dialogRef,
  onClose,
  isClosing = false,
  children,
}: {
  title: string;
  header?: React.ReactNode;
  dialogRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  isClosing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-[#030610]/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#070c1c] p-4 text-white shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex shrink-0 items-start gap-4 border-b border-white/8 pb-4 pr-8">
          {header ?? (
            <h2 id="booking-dialog-title" className="text-base font-black">
              {title}
            </h2>
          )}
        </div>
        <button
          type="button"
          aria-label="Close booking"
          disabled={isClosing}
          onClick={onClose}
          className="absolute right-4 top-4 grid size-7 place-items-center rounded-full text-lg text-slate-400 hover:bg-white/8 hover:text-white disabled:opacity-50"
        >
          ×
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}

function AccessPanel({
  title,
  description,
  actionLabel,
  onAction,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-[#030610]/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        className="relative w-full max-w-sm rounded-xl border border-white/10 bg-[#070c1c] p-6 text-center text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-access-title"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-xl text-slate-400 hover:text-white"
        >
          ×
        </button>
        <h2 id="booking-access-title" className="text-lg font-black">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-xs leading-5 text-slate-400">{description}</p>
        )}
        {children ??
          (actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-5 rounded-full bg-[#f23a1b] px-5 py-2.5 text-[11px] font-bold"
            >
              {actionLabel}
            </button>
          ) : null)}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 block w-full text-[10px] font-bold text-slate-400 hover:text-white"
        >
          Close
        </button>
      </section>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-48 place-content-center justify-items-center gap-3 text-center">
      <p className="text-sm text-slate-300" role="alert">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold hover:bg-white/15"
      >
        Retry
      </button>
    </div>
  );
}
