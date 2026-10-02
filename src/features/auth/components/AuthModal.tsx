import { useCallback, useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Modal } from "../../../components/ui/Modal";
import { mapApiErrors } from "../../forms/mapApiErrors";
import { useAuth } from "../context/useAuth";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "../validation/authSchemas";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type AuthModalProps = {
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: (mode: "login" | "register") => void;
};

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const {
    login,
    register,
    loginPending,
    registerPending,
    notice,
    clearNotice,
  } = useAuth();
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

  const openAuth = useCallback(
    (nextMode: "login" | "register") => {
      loginForm.setValue("password", "");
      signupForm.setValue("password", "");
      signupForm.setValue("confirmation", "");
      setFormNotice("");
      clearNotice();
      onSwitchMode(nextMode);
    },
    [clearNotice, loginForm, onSwitchMode, signupForm],
  );

  const updateAvatarPreview = useCallback((file?: File) => {
    if (avatarPreviewRef.current) {
      URL.revokeObjectURL(avatarPreviewRef.current);
    }
    const preview = file ? URL.createObjectURL(file) : null;
    avatarPreviewRef.current = preview;
    setAvatarPreview(preview);
  }, []);

  useEffect(
    () => () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    },
    [],
  );

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

  useEffect(() => {
    if (!mode) return;
    panelRef.current
      ?.querySelector<HTMLInputElement>('input:not([type="file"])')
      ?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [mode, onClose]);

  if (!mode) return null;

  return (
    <Modal
      panelRef={panelRef}
      onClose={onClose}
      className={`auth-panel ${mode === "register" ? "auth-panel-signup" : ""}`}
      ariaLabelledBy="auth-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="auth-title">{mode === "login" ? "Log in" : "Sign up"}</h2>
          <p>Welcome back to Kino XII</p>
        </div>
        <button
          className="close-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <span />
          <span />
        </button>
      </div>

      {mode === "login" ? (
        <LoginForm
          form={loginForm}
          formNotice={formNotice}
          notice={notice}
          loginPending={loginPending}
          onSubmit={submitLogin}
          onSwitchToRegister={() => openAuth("register")}
        />
      ) : (
        <RegisterForm
          form={signupForm}
          formNotice={formNotice}
          notice={notice}
          registerPending={registerPending}
          avatarPreview={avatarPreview}
          onSubmit={submitSignup}
          onSwitchToLogin={() => openAuth("login")}
          onAvatarChange={updateAvatarPreview}
        />
      )}
    </Modal>
  );
}
