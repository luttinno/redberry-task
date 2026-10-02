import { Oval } from "react-loader-spinner";

type SpinnerSize = "sm" | "md" | "lg";

const dimensions: Record<SpinnerSize, number> = {
  sm: 16,
  md: 32,
  lg: 64,
};

export function Spinner({
  size = "sm",
  label,
}: {
  size?: SpinnerSize;
  label: string;
}) {
  const dimension = dimensions[size];

  return (
    <span className="inline-flex shrink-0" aria-hidden="true">
      <Oval
        height={dimension}
        width={dimension}
        color="#f23a1b"
        secondaryColor="#55596a"
        strokeWidth={3}
        strokeWidthSecondary={3}
        ariaLabel={label}
        visible
      />
    </span>
  );
}

export function ScreenLoader({ label }: { label: string }) {
  return (
    <div
      className="grid min-h-[70vh] place-content-center justify-items-center gap-4 px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" label={label} />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}