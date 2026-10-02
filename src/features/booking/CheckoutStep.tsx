import type { UseFormReturn } from "react-hook-form";
import type { SeatHold } from "./types";
import type { CheckoutValues } from "./checkoutSchema";
import type { FormEventHandler, ReactNode } from "react";

function formatPrice(value: number) {
  return `₾${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)}`;
}

export default function CheckoutStep({
  hold,
  form,
  busy,
  error,
  remainingSeconds,
  onBack,
  onSubmit,
}: {
  hold: SeatHold;
  form: UseFormReturn<CheckoutValues>;
  busy: boolean;
  error: string;
  remainingSeconds: number;
  onBack: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const fields = form.register;
  const errors = form.formState.errors;

  return (
    <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <form
        id="checkout-form"
        noValidate
        onSubmit={onSubmit}
        className="min-w-0 space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckoutField
            label="Full name"
            error={errors.fullName?.message}
            className="sm:col-span-2"
          >
            <input
              id="checkout-full-name"
              autoComplete="name"
              className={inputClass}
              {...fields("fullName")}
            />
          </CheckoutField>
          <CheckoutField label="Email" error={errors.email?.message}>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...fields("email")}
            />
          </CheckoutField>
          <CheckoutField
            label="Mobile number"
            error={errors.mobileNumber?.message}
          >
            <input
              id="checkout-mobile-number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className={inputClass}
              {...fields("mobileNumber")}
            />
          </CheckoutField>
        </div>
        <div className="border-t border-white/8 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckoutField
              label="Card number"
              error={errors.cardNumber?.message}
              className="sm:col-span-2"
            >
              <input
                type="text"
                id="checkout-card-number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                className={inputClass}
                {...fields("cardNumber")}
              />
            </CheckoutField>
            <CheckoutField label="Expiry" error={errors.expiry?.message}>
              <input
                type="text"
                id="checkout-expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                className={inputClass}
                {...fields("expiry")}
              />
            </CheckoutField>
            <CheckoutField label="CVV" error={errors.cvv?.message}>
              <input
                type="password"
                id="checkout-cvv"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                className={inputClass}
                {...fields("cvv")}
              />
            </CheckoutField>
          </div>
        </div>
        {error && (
          <p className="text-xs text-rose-300" role="alert">
            {error}
          </p>
        )}
        <p className="text-[9px] leading-4 text-slate-500">
          Payment is simulated. Card details are not stored.
        </p>
      </form>

      <aside className="flex min-h-0 flex-col border-t border-white/8 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <h3 className="text-sm font-black">Summary</h3>
        <div className="mt-3 rounded-lg bg-[#1d2030] p-3">
          <div className="border-b border-white/8 pb-3">
            <p className="text-xs font-black">
              {hold.seats.length} selected seats
            </p>
            <div className="mt-2 space-y-1.5">
              {hold.seats.map((seat) => (
                <div
                  key={seat.seatId}
                  className="flex justify-between gap-2 text-[10px]"
                >
                  <span className="text-slate-300">
                    {seat.code} · {seat.ticketType.name}
                  </span>
                  <span>{formatPrice(seat.price)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase">
            <span>Total</span>
            <span className="text-base normal-case">
              {formatPrice(hold.subtotal)}
            </span>
          </div>
        </div>
        <p className="mt-auto pt-5 text-[9px] text-slate-500">
          Hold expires in {minutes}:{String(seconds).padStart(2, "0")}
        </p>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="w-full rounded-full bg-white/8 px-4 py-2.5 text-[11px] font-bold text-white hover:bg-white/12 disabled:opacity-50"
          >
            Back to seats
          </button>
          <button
            type="submit"
            form="checkout-form"
            disabled={busy || !form.formState.isValid}
            className="w-full rounded-full bg-[#f23a1b] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#d92e1a] disabled:cursor-not-allowed disabled:bg-[#505261]"
          >
            {busy ? "Processing…" : "Pay & Complete Order"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function CheckoutField({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  const id = `checkout-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-bold text-slate-200"
      >
        {label}
      </label>
      <div className={error ? "[&_input]:border-rose-500" : ""}>{children}</div>
      {error && <p className="mt-1 text-[9px] text-rose-300">{error}</p>}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-transparent bg-[#202232] px-3 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-slate-500";
