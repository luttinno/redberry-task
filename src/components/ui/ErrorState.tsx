type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  variant?: "inline" | "compact" | "centered";
};

const containerClasses = {
  inline:
    "flex min-h-24 flex-wrap items-center justify-between gap-4 rounded-lg border border-white/8 bg-white/3 px-5 py-4",
  compact: "flex flex-col items-start gap-3",
  centered: "grid min-h-48 place-content-center justify-items-center gap-3 text-center",
};

const messageClasses = {
  inline: "text-sm text-slate-300",
  compact: "text-xs text-slate-300",
  centered: "text-sm text-slate-300",
};

const retryClasses = {
  inline: "font-bold text-[#ff604c] hover:text-white",
  compact: "font-bold text-[#ff604c] hover:text-white",
  centered:
    "rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold hover:bg-white/15",
};

export function ErrorState({
  message,
  onRetry,
  variant = "inline",
}: ErrorStateProps) {
  return (
    <div className={containerClasses[variant]}>
      <p className={messageClasses[variant]} role="alert">
        {message}
      </p>
      <button type="button" className={retryClasses[variant]} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}