import { createContext } from "react";
import type { LoginCredentials, RegisterCredentials, User } from "../types";

export type AuthStatus = "loading" | "authenticated" | "guest";
export type AuthModal = "login" | "register" | null;

export interface AuthContextValue {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  modal: AuthModal;
  notice: string;
  loginPending: boolean;
  registerPending: boolean;
  logoutPending: boolean;
  openAuth: (modal: Exclude<AuthModal, null>) => void;
  closeAuth: () => void;
  clearNotice: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: (
    action: () => void | Promise<void>,
    options?: { requiresCompleteProfile?: boolean },
  ) => void;
  continuePendingAction: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
