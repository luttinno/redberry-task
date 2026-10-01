import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import "./App.css";

type AuthMode = "login" | "signup";

type LoginFields = {
  email: string;
  password: string;
};

type SignupFields = {
  username: string;
  email: string;
  password: string;
  confirmation: string;
};

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const loginForm = useForm<LoginFields>({ mode: "onBlur" });
  const signupForm = useForm<SignupFields>({ mode: "onBlur" });
  const loginValues = useWatch({ control: loginForm.control });
  const signupValues = useWatch({ control: signupForm.control });

  const openAuth = (nextMode: AuthMode) => {
    setMode(nextMode);
    setIsOpen(true);
    setNotice("");
  };

  const closeAuth = () => {
    setIsOpen(false);
    setNotice("");
  };

  const submitLogin = loginForm.handleSubmit(() => {
    setNotice("Sign-in is not connected to the API yet.");
  });

  const submitSignup = signupForm.handleSubmit(() => {
    setNotice("Registration is not connected to the API yet.");
  });

  useEffect(() => {
    if (!isOpen) return;

    panelRef.current
      ?.querySelector<HTMLInputElement>('input:not([type="file"])')
      ?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAuth();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <main className={`cinema-shell ${isOpen ? "has-modal" : ""}`}>
      <div className="cinema-scene">
        <header className="site-header">
          <a className="brand" href="#home" aria-label="Kino XII home">
            KINO <span>XII</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#movies">Movies</a>
            <a href="#sessions">Sessions</a>
          </nav>
          <div className="header-actions">
            <button
              className="button button-primary"
              onClick={() => openAuth("signup")}
            >
              Sign up
            </button>
            <button
              className="button button-light"
              onClick={() => openAuth("login")}
            >
              Log in
            </button>
          </div>
        </header>
        <div className="scene-copy">
          <span className="eyebrow">THE CINEMA EXPERIENCE</span>
          <h1>
            Stories belong
            <br />
            on the big screen.
          </h1>
          <p>Find your next film. Make a night of it.</p>
          <button
            className="button button-primary"
            onClick={() => openAuth("signup")}
          >
            Explore movies <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="scene-bottom">
          <span>NOW SHOWING</span>
          <div className="scene-rule">
            <i />
          </div>
          <span>01 / 04</span>
        </div>
      </div>

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
                registration={loginForm.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
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
                registration={loginForm.register("password", {
                  required: "Password is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                })}
              />
              {notice && (
                <p className="form-notice" role="status">
                  {notice}
                </p>
              )}
              <button className="submit-button" type="submit">
                Log in
              </button>
              <p className="switch-copy">
                Don’t have an account?{" "}
                <button type="button" onClick={() => openAuth("signup")}>
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
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && file.size <= 2 * 1024 * 1024)
                      setAvatar(URL.createObjectURL(file));
                    else if (file)
                      setNotice("Avatar must be an image under 2 MB.");
                  }}
                />
                <span className="avatar-preview">
                  {avatar ? (
                    <img src={avatar} alt="Avatar preview" />
                  ) : (
                    <span aria-hidden="true">+</span>
                  )}
                </span>
                <span>
                  <strong>Upload avatar (optional)</strong>
                  <small>JPG, PNG or WEBP · max 2 MB</small>
                </span>
              </label>
              <Field
                label="Username"
                placeholder="Your username"
                error={signupForm.formState.errors.username?.message}
                valid={Boolean(
                  signupForm.formState.touchedFields.username &&
                  signupValues.username &&
                  !signupForm.formState.errors.username,
                )}
                registration={signupForm.register("username", {
                  required: "Username is required",
                  minLength: { value: 3, message: "At least 3 characters" },
                })}
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
                registration={signupForm.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
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
                  registration={signupForm.register("password", {
                    required: "Password is required",
                    minLength: { value: 3, message: "At least 3 characters" },
                  })}
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
                  registration={signupForm.register("confirmation", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === signupForm.getValues("password") ||
                      "Passwords do not match",
                  })}
                />
              </div>
              {notice && (
                <p className="form-notice" role="status">
                  {notice}
                </p>
              )}
              <button className="submit-button" type="submit">
                Sign up
              </button>
              <p className="switch-copy">
                Already have an account?{" "}
                <button type="button" onClick={() => openAuth("login")}>
                  Log in
                </button>
              </p>
            </form>
          )}
        </section>
      )}
    </main>
  );
}

type FieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  valid?: boolean;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
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
