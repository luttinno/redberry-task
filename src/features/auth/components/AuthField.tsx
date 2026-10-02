import type { UseFormRegisterReturn } from "react-hook-form";

type AuthFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  valid?: boolean;
  registration: UseFormRegisterReturn;
};

export function AuthField({
  label,
  type = "text",
  placeholder,
  error,
  valid,
  registration,
}: AuthFieldProps) {
  const id = `field-${registration.name}`;

  return (
    <div
      className={`field ${error ? "field-invalid" : ""} ${valid ? "field-valid" : ""}`}
    >
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
        />
        {error && (
          <span className="field-mark" aria-hidden="true">
            !
          </span>
        )}
        {!error && valid && (
          <span className="field-mark" aria-hidden="true">
            ✓
          </span>
        )}
      </div>
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
