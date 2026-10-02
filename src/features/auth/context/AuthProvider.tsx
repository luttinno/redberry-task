import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { authApi } from "../../../api/auth";
import { ApiError, setUnauthorizedHandler } from "../../../api/client";
import type { LoginCredentials, RegisterCredentials, User } from "../types";
import { AuthContext, type AuthContextValue } from "./authContext";
import type { AuthModal, AuthStatus } from "./authContext";

const TOKEN_KEY = "kino-xii-token";

type PendingAction = {
  callback: () => void | Promise<void>;
  requiresCompleteProfile: boolean;
  replayedAfterAuthentication: boolean;
};

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(readStoredToken);
  const [modal, setModal] = useState<AuthModal>(null);
  const [notice, setNotice] = useState("");
  const pendingAction = useRef<PendingAction | null>(null);
  const activeAction = useRef<PendingAction | null>(null);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
        throw error;
      }
    },
    enabled: Boolean(token),
    retry: false,
  });
  const user = token ? (currentUserQuery.data ?? null) : null;
  const status: AuthStatus = user
    ? "authenticated"
    : !token || currentUserQuery.isError
      ? "guest"
      : "loading";

  const loginMutation = useMutation({ mutationFn: authApi.login });
  const registerMutation = useMutation({ mutationFn: authApi.register });
  const logoutMutation = useMutation({ mutationFn: authApi.logout });

  const runAction = useCallback(async (action: PendingAction) => {
    activeAction.current = action;
    try {
      await action.callback();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        setNotice(
          error instanceof Error
            ? error.message
            : "The requested action failed.",
        );
      }
    } finally {
      activeAction.current = null;
    }
  }, []);

  const executePendingAction = useCallback(
    async (authenticatedUser: User | null) => {
      if (!authenticatedUser) return;
      const action = pendingAction.current;
      if (!action) return;
      if (
        action.requiresCompleteProfile &&
        !authenticatedUser.profileComplete
      ) {
        setNotice("Complete your profile before continuing with this action.");
        return;
      }
      pendingAction.current = null;
      await runAction(action);
    },
    [runAction],
  );

  const continuePendingAction = useCallback(async () => {
    await executePendingAction(user);
  }, [executePendingAction, user]);

  const handleUnauthorized = useCallback(() => {
    const failedAction = activeAction.current;
    const canReplay = Boolean(
      failedAction && !failedAction.replayedAfterAuthentication,
    );
    if (failedAction && canReplay) {
      failedAction.replayedAfterAuthentication = true;
      pendingAction.current = failedAction;
    } else {
      pendingAction.current = null;
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setModal("login");
    setNotice(
      canReplay
        ? "Your session expired. Log in to continue."
        : "Your session could not be restored. Log in to continue.",
    );
    queryClient.removeQueries({ queryKey: ["current-user"] });
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const finishAuthentication = useCallback(
    async (result: { token: string; user: User }, successMessage: string) => {
      localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setModal(null);
      queryClient.setQueryData(["current-user"], result.user);
      toast.success(successMessage);

      if (!result.user.profileComplete) {
        setNotice(
          "Your account is signed in. Complete your profile before booking.",
        );
      } else {
        setNotice("");
      }
      await executePendingAction(result.user);
    },
    [executePendingAction, queryClient],
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginMutation.mutateAsync(credentials);
      await finishAuthentication(result, "Welcome back!");
    },
    [finishAuthentication, loginMutation],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await registerMutation.mutateAsync(credentials);
      await finishAuthentication(result, "Your account is ready.");
    },
    [finishAuthentication, registerMutation],
  );

  const logout = useCallback(async () => {
    let logoutConfirmed = true;
    try {
      if (token) await logoutMutation.mutateAsync();
    } catch {
      logoutConfirmed = false;
      setNotice(
        "You have been signed out. The server session could not be confirmed.",
      );
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setModal(null);
      pendingAction.current = null;
      activeAction.current = null;
      queryClient.clear();
      if (logoutConfirmed) toast.success("Signed out successfully.");
    }
  }, [logoutMutation, queryClient, token]);

  const requireAuth = useCallback(
    (
      action: () => void | Promise<void>,
      options: { requiresCompleteProfile?: boolean } = {},
    ) => {
      const pending: PendingAction = {
        callback: action,
        requiresCompleteProfile: options.requiresCompleteProfile ?? false,
        replayedAfterAuthentication: false,
      };
      if (status !== "authenticated" || !user) {
        pendingAction.current = pending;
        setNotice("");
        setModal("login");
        return;
      }
      if (pending.requiresCompleteProfile && !user.profileComplete) {
        pendingAction.current = pending;
        setModal(null);
        setNotice("Complete your profile before continuing with this action.");
        return;
      }
      void runAction(pending);
    },
    [runAction, status, user],
  );

  const openAuth = useCallback((nextModal: Exclude<AuthModal, null>) => {
    setNotice("");
    setModal(nextModal);
  }, []);

  const closeAuth = useCallback(() => {
    setModal(null);
    pendingAction.current = null;
    setNotice("");
  }, []);

  const retrySessionRestore = useCallback(async () => {
    if (!token) return;
    await currentUserQuery.refetch();
  }, [currentUserQuery, token]);

  const visibleNotice =
    notice ||
    (token && currentUserQuery.isError
      ? "We could not restore your session. Retry or log in again."
      : "");

  const value: AuthContextValue = {
    token,
    user,
    status,
    modal,
    notice: visibleNotice,
    loginPending: loginMutation.isPending,
    registerPending: registerMutation.isPending,
    logoutPending: logoutMutation.isPending,
    openAuth,
    closeAuth,
    clearNotice: () => setNotice(""),
    login,
    register,
    logout,
    requireAuth,
    continuePendingAction,
    retrySessionRestore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
