import type { MouseEvent, ReactNode, RefObject } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  panelRef?: RefObject<HTMLElement | null>;
  backdropClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  closeButton?: ReactNode;
  disableBackdropClose?: boolean;
  tabIndex?: number;
};

export function Modal({
  children,
  onClose,
  className = "",
  panelRef,
  backdropClassName = "auth-backdrop",
  ariaLabel,
  ariaLabelledBy,
  closeButton,
  disableBackdropClose = false,
  tabIndex = -1,
}: ModalProps) {
  return (
    <div
      className={backdropClassName}
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (!disableBackdropClose && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={tabIndex}
        className={className}
      >
        {closeButton}
        {children}
      </section>
    </div>
  );
}
