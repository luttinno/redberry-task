import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";

export function BookingShell({
  title,
  header,
  dialogRef,
  onClose,
  isClosing = false,
  children,
}: {
  title: string;
  header?: ReactNode;
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  isClosing?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal
      panelRef={dialogRef}
      onClose={onClose}
      backdropClassName="auth-backdrop grid place-items-center p-4"
      className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#070c1c] p-4 text-white shadow-2xl sm:p-6"
      ariaLabelledBy="booking-dialog-title"
      closeButton={
        <button
          type="button"
          aria-label="Close booking"
          disabled={isClosing}
          onClick={onClose}
          className="absolute right-4 top-4 grid size-7 place-items-center rounded-full text-lg text-slate-400 hover:bg-white/8 hover:text-white disabled:opacity-50"
        >
          ×
        </button>
      }
    >
      <div className="mb-4 flex shrink-0 items-start gap-4 border-b border-white/8 pb-4 pr-8">
        {header ?? (
          <h2 id="booking-dialog-title" className="text-base font-black">
            {title}
          </h2>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </Modal>
  );
}

export function AccessPanel({
  title,
  description,
  actionLabel,
  onAction,
  onClose,
  loading = false,
  children,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  loading?: boolean;
  children?: ReactNode;
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
    <Modal
      panelRef={panelRef}
      onClose={onClose}
      className="relative w-full max-w-sm rounded-xl border border-white/10 bg-[#070c1c] p-6 text-center text-white shadow-2xl"
      ariaLabelledBy="booking-access-title"
      closeButton={
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-xl text-slate-400 hover:text-white"
        >
          ×
        </button>
      }
      backdropClassName="fixed inset-0 z-40 grid place-items-center bg-[#030610]/75 p-4 backdrop-blur-sm"
    >
      {loading && <Spinner size="lg" label={title} />}
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
    </Modal>
  );
}
