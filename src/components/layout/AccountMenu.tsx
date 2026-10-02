import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../features/auth/types";
import { Spinner } from "../ui/Spinner";

export function AccountMenu({
  user,
  logout,
  logoutPending,
}: {
  user: User;
  logout: () => Promise<void>;
  logoutPending: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const displayName = user.fullName || user.username;
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="relative shrink-0" ref={accountRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        aria-expanded={isOpen}
        aria-controls="account-menu"
        aria-label={isOpen ? "Close account menu" : "Open account menu"}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-[#202334] text-[10px] font-bold text-white">
          {user.avatar ? (
            <img
              className="absolute inset-0 size-full object-cover"
              src={user.avatar}
              alt=""
            />
          ) : (
            initials
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#070c1a] ${user.profileComplete ? "bg-emerald-400" : "bg-amber-500"}`}
          />
        </span>
        <span className="max-w-18 truncate text-[11px] font-semibold text-slate-100 sm:max-w-24">
          {user.username}
        </span>
        <span
          className={`text-slate-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <svg className="size-3" viewBox="0 0 16 16" fill="none">
            <path
              d="m4.5 6 3.5 3.5L11.5 6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          id="account-menu"
          className="absolute right-0 top-[calc(100%+7px)] z-50 w-[min(253px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#070c1a] shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
        >
          <div className="flex min-w-0 items-center gap-2.5 px-4 pt-4">
            <span className="relative size-9 shrink-0">
              {user.avatar ? (
                <img
                  className="size-9 rounded-lg object-cover"
                  src={user.avatar}
                  alt=""
                />
              ) : (
                <span className="grid size-9 place-items-center rounded-lg bg-[#202334] text-[10px] font-bold text-white">
                  {initials}
                </span>
              )}

              {/* Status dot */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 z-10 size-2.5 rounded-full border-2 border-[#070c1a] ${
                  user.profileComplete ? "bg-emerald-400" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-[12px] font-semibold text-white">
                {user.fullName}
              </strong>
              <span className="mt-1 block truncate text-[10px] text-slate-400">
                {user.email}
              </span>
            </span>
          </div>

          <div
            className={`mx-4 mt-3 rounded-lg px-2.5 py-2 ${user.profileComplete ? "bg-emerald-500/10" : "bg-[#201a1a]"}`}
          >
            <strong
              className={`block text-[11px] font-semibold ${user.profileComplete ? "text-emerald-300" : "text-amber-500"}`}
            >
              {user.profileComplete ? "Profile complete" : "Profile incomplete"}
            </strong>
            {!user.profileComplete && (
              <p className="mt-0.5 text-[10px] leading-3.25 text-slate-400">
                Please complete your profile to enable booking.
              </p>
            )}
          </div>

          <div className="mt-2 grid px-2 pb-1 pt-1 text-[12px] font-semibold">
            <Link
              className="flex min-h-10 items-center gap-2 rounded-md px-2 text-slate-100 transition hover:bg-white/5"
              to="/profile"
              onClick={closeMenu}
            >
              <HeaderIcon name="profile" />
              My Profile
            </Link>
            <Link
              className="flex min-h-10 items-center gap-2 rounded-md px-2 text-slate-100 transition hover:bg-white/5"
              to="/tickets"
              onClick={closeMenu}
            >
              <HeaderIcon name="tickets" />
              My Tickets
            </Link>
          </div>
          <div className="border-t border-white/8 px-2 py-1">
            <button
              type="button"
              className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-[#ff604c] transition hover:bg-white/5 disabled:opacity-50"
              disabled={logoutPending}
              onClick={() => {
                closeMenu();
                void logout();
              }}
            >
              <HeaderIcon name="logout" />
              {logoutPending && <Spinner label="Logging out" />}
              {logoutPending ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderIcon({ name }: { name: "profile" | "tickets" | "logout" }) {
  const iconPaths = {
    profile: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </>
    ),
    tickets: (
      <>
        <path d="M4 7.5A2.5 2.5 0 0 0 4 12.5v4A1.5 1.5 0 0 0 5.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-4a2.5 2.5 0 0 0 0-5V7.5A1.5 1.5 0 0 0 18.5 6h-13A1.5 1.5 0 0 0 4 7.5Z" />
        <path d="M12 7v2m0 2v2m0 2v1" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}
