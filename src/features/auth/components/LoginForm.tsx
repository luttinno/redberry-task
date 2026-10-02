import type { UseFormReturn } from "react-hook-form";
import type { LoginFormValues } from "../validation/authSchemas";
import { AuthField } from "./AuthField";

type LoginFormProps = {
  form: UseFormReturn<LoginFormValues>;
  formNotice: string;
  notice: string;
  loginPending: boolean;
  onSubmit: () => void;
  onSwitchToRegister: () => void;
};

export function LoginForm({
  form,
  formNotice,
  notice,
  loginPending,
  onSubmit,
  onSwitchToRegister,
}: LoginFormProps) {
  const loginValues = form.watch();

  return (
    <form className="auth-form login-form" onSubmit={onSubmit} noValidate>
      <AuthField
        label="Email"
        type="email"
        placeholder="example@gmail.com"
        error={form.formState.errors.email?.message}
        valid={Boolean(
          form.formState.touchedFields.email &&
          loginValues.email &&
          !form.formState.errors.email,
        )}
        registration={form.register("email")}
      />
      <AuthField
        label="Password"
        type="password"
        placeholder="••••••••"
        error={form.formState.errors.password?.message}
        valid={Boolean(
          form.formState.touchedFields.password &&
          loginValues.password &&
          !form.formState.errors.password,
        )}
        registration={form.register("password")}
      />
      {(formNotice || notice) && (
        <p className="form-notice" role="status">
          {formNotice || notice}
        </p>
      )}
      <button className="submit-button" type="submit" disabled={loginPending}>
        {loginPending ? "Logging in…" : "Log in"}
      </button>
      <p className="switch-copy">
        Don’t have an account?{" "}
        <button
          type="button"
          disabled={loginPending}
          onClick={onSwitchToRegister}
        >
          Sign up
        </button>
      </p>
    </form>
  );
}
