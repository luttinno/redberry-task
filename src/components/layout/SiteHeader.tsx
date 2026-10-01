import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/useAuth";

type SiteHeaderProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
};

export default function SiteHeader({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: SiteHeaderProps) {
  const { user, status, openAuth, logout, logoutPending } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    if (onSearchSubmit) onSearchSubmit();
    else navigate("/", { state: { search: searchValue.trim() } });
  };

  return (
    <header className="relative z-20 mx-auto flex min-h-16 max-w-[1800px] flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 sm:px-8 lg:flex-nowrap lg:gap-8 lg:px-12 lg:py-0">
      <Link
        to="/"
        className="shrink-0 text-[15px] font-black tracking-wide text-white"
        aria-label="Kino XII home"
      >
        KINO <span className="text-[#f43b24]">XII</span>
      </Link>
      <nav className="hidden items-center gap-7 text-[10px] font-bold uppercase tracking-[.14em] text-slate-300 sm:flex">
        <Link className="hover:text-white" to="/sessions">
          Sessions
        </Link>
      </nav>
      <form
        onSubmit={submitSearch}
        className="order-3 flex h-9 w-full min-w-0 max-w-none items-center rounded-full border border-white/10 bg-white/6 px-4 text-slate-400 focus-within:border-white/30 lg:order-0 lg:ml-auto lg:max-w-105"
      >
        <label className="sr-only" htmlFor="site-search">
          Search movies
        </label>
        <input
          id="site-search"
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search films and events"
          className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-400"
        />
        <span aria-hidden="true" className="ml-2 text-sm">
          ⌕
        </span>
      </form>

      {status === "loading" ? (
        <span className="hidden text-[10px] text-slate-400 sm:block">
          Restoring…
        </span>
      ) : user ? (
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            aria-expanded={profileMenuOpen}
            aria-label="Open account menu"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            {user.avatar ? (
              <img
                className="h-9 w-9 rounded-md object-cover"
                src={user.avatar}
                alt=""
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-md bg-[#272a3a] text-xs font-bold text-white">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span
              className={`-ml-3 mt-6 h-2 w-2 rounded-full border border-[#070c1c] ${user.profileComplete ? "bg-emerald-400" : "bg-amber-400"}`}
              aria-label={
                user.profileComplete ? "Profile complete" : "Profile incomplete"
              }
            />
            <span className="hidden text-[11px] text-slate-200 md:inline">
              {user.fullName || user.username}
            </span>
            <span
              className="hidden text-slate-400 md:inline"
              aria-hidden="true"
            >
              {profileMenuOpen ? "⌃" : "⌄"}
            </span>
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 top-12 w-[min(300px,calc(100vw-32px))] rounded-xl border border-white/10 bg-[#080d1c] p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    className="h-10 w-10 rounded-md object-cover"
                    src={user.avatar}
                    alt=""
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#272a3a] text-xs font-bold text-white">
                    {user.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <strong className="block truncate text-xs">
                    {user.fullName || user.username}
                  </strong>
                  <span className="mt-1 block truncate text-[10px] text-slate-400">
                    {user.email}
                  </span>
                </span>
              </div>
              <div
                className={`mt-3 rounded-md px-3 py-2 text-[11px] font-bold ${user.profileComplete ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}
              >
                {user.profileComplete
                  ? "Profile Complete  ✓"
                  : "Profile incomplete"}
              </div>
              {!user.profileComplete && (
                <p className="mt-1 rounded-md bg-amber-500/8 px-3 py-2 text-[10px] leading-4 text-slate-400">
                  Please complete your profile to enable booking.
                </p>
              )}
              <div className="mt-3 grid gap-1 border-t border-white/10 pt-3 text-xs">
                <Link
                  className="rounded px-2 py-2 hover:bg-white/5"
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  My profile
                </Link>
                <Link
                  className="rounded px-2 py-2 hover:bg-white/5"
                  to="/tickets"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  My tickets
                </Link>
                <button
                  className="rounded px-2 py-2 text-left text-[#ff604c] hover:bg-white/5 disabled:opacity-50"
                  disabled={logoutPending}
                  onClick={() => void logout()}
                >
                  {logoutPending ? "Logging out…" : "Log out"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="rounded-full bg-[#f23a23] px-4 py-2 text-[10px] font-bold hover:bg-[#d92e1a]"
            onClick={() => openAuth("register")}
          >
            Sign up
          </button>
          <button
            className="rounded-full bg-white px-4 py-2 text-[10px] font-bold text-[#101321] hover:bg-slate-200"
            onClick={() => openAuth("login")}
          >
            Log in
          </button>
        </div>
      )}
    </header>
  );
}
