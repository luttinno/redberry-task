import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { mapApiErrors } from "./features/forms/mapApiErrors";
import { useAuth } from "./features/auth/context/useAuth";
import HomePage from "./features/home/HomePage";
import MovieDetailsPage from "./features/movies/MovieDetailsPage";
import ProfilePage from "./features/profile/ProfilePage";
import TicketsPage from "./features/profile/TicketsPage";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "./features/auth/validation/authSchemas";
import "./App.css";

function App() {
  const {
    token,
    status,
    modal,
    notice,
    loginPending,
    registerPending,
    openAuth: showAuth,
    closeAuth: dismissAuth,
    clearNotice,
    login,
    register,
    retrySessionRestore,
  } = useAuth();
  const isOpen = modal !== null;
  const mode = modal === "register" ? "signup" : "login";
  const [formNotice, setFormNotice] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarPreviewRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });
  const signupForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmation: "",
      avatar: undefined,
    },
  });
  const loginValues = useWatch({ control: loginForm.control });
  const signupValues = useWatch({ control: signupForm.control });

  const openAuth = (nextMode: "login" | "register") => {
    loginForm.setValue("password", "");
    signupForm.setValue("password", "");
    signupForm.setValue("confirmation", "");
    setFormNotice("");
    clearNotice();
    showAuth(nextMode);
  };

  const closeAuth = useCallback(() => {
    setFormNotice("");
    dismissAuth();
  }, [dismissAuth]);

  const updateAvatarPreview = (file?: File) => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    const preview = file ? URL.createObjectURL(file) : null;
    avatarPreviewRef.current = preview;
    setAvatarPreview(preview);
  };

  const submitLogin = loginForm.handleSubmit(async (values) => {
    setFormNotice("");
    clearNotice();
    try {
      await login(values);
    } catch (error) {
      setFormNotice(
        mapApiErrors(error, loginForm.setError, {
          email: "email",
          password: "password",
        }),
      );
    }
  });

  const submitSignup = signupForm.handleSubmit(async (values) => {
    setFormNotice("");
    clearNotice();
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        passwordConfirmation: values.confirmation,
        avatar: values.avatar,
      });
    } catch (error) {
      setFormNotice(
        mapApiErrors(error, signupForm.setError, {
          username: "username",
          email: "email",
          password: "password",
          password_confirmation: "confirmation",
          avatar: "avatar",
        }),
      );
    }
  });

  useEffect(
    () => () => {
      if (avatarPreviewRef.current)
        URL.revokeObjectURL(avatarPreviewRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current
      ?.querySelector<HTMLInputElement>('input:not([type="file"])')
      ?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuth();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeAuth, isOpen, mode]);

  return (
    <div className="relative min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
        <Route
          path="/sessions/:sessionId/seats"
          element={<SeatSelectionRoutePlaceholder />}
        />
        <Route
          path="/sessions"
          element={<PagePlaceholder title="Sessions" />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {notice && !isOpen && (
        <aside className="session-notice" role="status">
          <span>{notice}</span>
          {token && status !== "authenticated" && (
            <button onClick={() => void retrySessionRestore()}>Retry</button>
          )}
          <button
            className="notice-close"
            aria-label="Dismiss message"
            onClick={clearNotice}
          >
            ×
          </button>
        </aside>
      )}

      {isOpen && <div className="auth-backdrop" onClick={closeAuth} />}
      {isOpen && (
        <section
          ref={panelRef}
          className={`auth-panel ${mode === "signup" ? "auth-panel-signup" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <div className="panel-heading">
            <div>
              <h2 id="auth-title">{mode === "login" ? "Log in" : "Sign up"}</h2>
              <p>Welcome back to Kino XII</p>
            </div>
            <button
              className="close-button"
              aria-label="Close dialog"
              onClick={closeAuth}
            >
              <span />
              <span />
            </button>
          </div>

          {mode === "login" ? (
            <form
              className="auth-form login-form"
              onSubmit={submitLogin}
              noValidate
            >
              <Field
                label="Email"
                type="email"
                placeholder="example@gmail.com"
                error={loginForm.formState.errors.email?.message}
                valid={Boolean(
                  loginForm.formState.touchedFields.email &&
                  loginValues.email &&
                  !loginForm.formState.errors.email,
                )}
                registration={loginForm.register("email")}
              />
              <Field
                label="Password"
                type="password"
                placeholder="••••••••"
                error={loginForm.formState.errors.password?.message}
                valid={Boolean(
                  loginForm.formState.touchedFields.password &&
                  loginValues.password &&
                  !loginForm.formState.errors.password,
                )}
                registration={loginForm.register("password")}
              />
              {(formNotice || notice) && (
                <p className="form-notice" role="status">
                  {formNotice || notice}
                </p>
              )}
              <button
                className="submit-button"
                type="submit"
                disabled={loginPending}
              >
                {loginPending ? "Logging in…" : "Log in"}
              </button>
              <p className="switch-copy">
                Don’t have an account?{" "}
                <button
                  type="button"
                  disabled={loginPending}
                  onClick={() => openAuth("register")}
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form
              className="auth-form signup-form"
              onSubmit={submitSignup}
              noValidate
            >
              <label className="avatar-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Upload avatar"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    const validation =
                      registerSchema.shape.avatar.safeParse(file);
                    if (file && !validation.success) {
                      signupForm.setError("avatar", {
                        type: "validate",
                        message:
                          validation.error.issues[0]?.message ??
                          "Invalid avatar image",
                      });
                      signupForm.setValue("avatar", undefined);
                      updateAvatarPreview();
                      return;
                    }
                    signupForm.clearErrors("avatar");
                    signupForm.setValue("avatar", file, {
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                    updateAvatarPreview(file);
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
              {signupForm.formState.errors.avatar?.message && (
                <small className="field-error" role="alert">
                  {signupForm.formState.errors.avatar.message}
                </small>
              )}
              <Field
                label="Username"
                placeholder="Your username"
                error={signupForm.formState.errors.username?.message}
                valid={Boolean(
                  signupForm.formState.touchedFields.username &&
                  signupValues.username &&
                  !signupForm.formState.errors.username,
                )}
                registration={signupForm.register("username")}
              />
              <Field
                label="Email"
                type="email"
                placeholder="example@gmail.com"
                error={signupForm.formState.errors.email?.message}
                valid={Boolean(
                  signupForm.formState.touchedFields.email &&
                  signupValues.email &&
                  !signupForm.formState.errors.email,
                )}
                registration={signupForm.register("email")}
              />
              <div className="field-pair">
                <Field
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={signupForm.formState.errors.password?.message}
                  valid={Boolean(
                    signupForm.formState.touchedFields.password &&
                    signupValues.password &&
                    !signupForm.formState.errors.password,
                  )}
                  registration={signupForm.register("password")}
                />
                <Field
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  error={signupForm.formState.errors.confirmation?.message}
                  valid={Boolean(
                    signupForm.formState.touchedFields.confirmation &&
                    signupValues.confirmation &&
                    !signupForm.formState.errors.confirmation,
                  )}
                  registration={signupForm.register("confirmation")}
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
                {registerPending ? "Signing up…" : "Sign up"}
              </button>
              <p className="switch-copy">
                Already have an account?{" "}
                <button
                  type="button"
                  disabled={registerPending}
                  onClick={() => openAuth("login")}
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function SeatSelectionRoutePlaceholder() {
  const { sessionId } = useParams();
  return (
    <PagePlaceholder
      title="Seat selection"
      description={`Session ${sessionId} is ready to book. Seat selection is not available yet.`}
    />
  );
}

function PagePlaceholder({
  title,
  description = "This page will be built from its design reference.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#070c1c] px-6 text-white">
      <div className="text-center">
        <Link
          to="/"
          className="text-xs font-bold uppercase tracking-[.18em] text-[#ff604c]"
        >
          Kino XII
        </Link>
        <h1 className="mt-5 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold hover:bg-white/20"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  valid?: boolean;
  registration: UseFormRegisterReturn;
};

function Field({
  label,
  type = "text",
  placeholder,
  error,
  valid,
  registration,
}: FieldProps) {
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

export default App;
