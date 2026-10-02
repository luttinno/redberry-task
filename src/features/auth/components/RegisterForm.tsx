import type { UseFormReturn } from "react-hook-form";
import { Spinner } from "../../../components/ui/Spinner";
import {
  registerSchema,
  type RegisterFormValues,
} from "../validation/authSchemas";
import { AuthField } from "./AuthField";

type RegisterFormProps = {
  form: UseFormReturn<RegisterFormValues>;
  formNotice: string;
  notice: string;
  registerPending: boolean;
  avatarPreview: string | null;
  onSubmit: () => void;
  onSwitchToLogin: () => void;
  onAvatarChange: (file?: File) => void;
};

export function RegisterForm({
  form,
  formNotice,
  notice,
  registerPending,
  avatarPreview,
  onSubmit,
  onSwitchToLogin,
  onAvatarChange,
}: RegisterFormProps) {
  const signupValues = form.watch();

  return (
    <form className="auth-form signup-form" onSubmit={onSubmit} noValidate>
      <label className="avatar-upload">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Upload avatar"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              const validation = registerSchema.shape.avatar.safeParse(file);
              if (!validation.success) {
                form.setError("avatar", {
                  type: "validate",
                  message:
                    validation.error.issues[0]?.message ??
                    "Invalid avatar image",
                });
                form.setValue("avatar", undefined);
                onAvatarChange();
                return;
              }
              form.clearErrors("avatar");
              form.setValue("avatar", file, {
                shouldValidate: true,
                shouldTouch: true,
              });
            }
            onAvatarChange(file);
          }}
        />
        <span className="avatar-preview">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar preview" />
          ) : (
            <span aria-hidden="true">+</span>
          )}
        </span>
        <span>
          <strong>Upload avatar (optional)</strong>
          <small>JPG, PNG or WEBP · max 2 MB</small>
        </span>
      </label>
      {form.formState.errors.avatar?.message && (
        <small className="field-error" role="alert">
          {form.formState.errors.avatar.message}
        </small>
      )}
      <AuthField
        label="Username"
        placeholder="Your username"
        error={form.formState.errors.username?.message}
        valid={Boolean(
          form.formState.touchedFields.username &&
          signupValues.username &&
          !form.formState.errors.username,
        )}
        registration={form.register("username")}
      />
      <AuthField
        label="Email"
        type="email"
        placeholder="example@gmail.com"
        error={form.formState.errors.email?.message}
        valid={Boolean(
          form.formState.touchedFields.email &&
          signupValues.email &&
          !form.formState.errors.email,
        )}
        registration={form.register("email")}
      />
      <div className="field-pair">
        <AuthField
          label="Password"
          type="password"
          placeholder="••••••••"
          error={form.formState.errors.password?.message}
          valid={Boolean(
            form.formState.touchedFields.password &&
            signupValues.password &&
            !form.formState.errors.password,
          )}
          registration={form.register("password")}
        />
        <AuthField
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={form.formState.errors.confirmation?.message}
          valid={Boolean(
            form.formState.touchedFields.confirmation &&
            signupValues.confirmation &&
            !form.formState.errors.confirmation,
          )}
          registration={form.register("confirmation")}
        />
      </div>
      {(formNotice || notice) && (
        <p className="form-notice" role="status">
          {formNotice || notice}
        </p>
      )}
      <button
        className="submit-button"
        type="submit"
        disabled={registerPending}
      >
        {registerPending && <Spinner label="Signing up" />}
        {registerPending ? "Signing up…" : "Sign up"}
      </button>
      <p className="switch-copy">
        Already have an account?{" "}
        <button
          type="button"
          disabled={registerPending}
          onClick={onSwitchToLogin}
        >
          Log in
        </button>
      </p>
    </form>
  );
}
