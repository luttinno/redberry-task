import { type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/useAuth";
import { Spinner } from "../ui/Spinner";
import { AccountMenu } from "./AccountMenu";

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
  const navigate = useNavigate();

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    if (onSearchSubmit) onSearchSubmit();
    else navigate("/", { state: { search: searchValue.trim() } });
  };

  return (
    <header className="relative z-20 mx-auto flex min-h-16 max-w-[1800px] flex-wrap items-center gap-3 px-4 py-2 sm:flex-nowrap sm:px-8 lg:gap-8 lg:px-12">
      <Link
        to="/"
        className="hidden shrink-0 items-center text-[15px] font-black tracking-widest text-white sm:inline-flex"
        aria-label="Kino XII home"
      >
        KINO <span className="ml-1 text-[#f43b24]">XII</span>
      </Link>

      <nav className="hidden items-center gap-7 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 sm:flex">
        <Link className="transition hover:text-white" to="/sessions">
          Sessions
        </Link>
      </nav>

      <form
        onSubmit={submitSearch}
        className="order-1 flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-[#dfe3e6]/20 px-4 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition focus-within:border-white/30 sm:order-0 sm:max-w-135 lg:ml-auto"
      >
        <label className="sr-only" htmlFor="site-search">
          Search movies
        </label>
        <svg
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.2 4.2" />
        </svg>
        <input
          id="site-search"
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search films and live events"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-slate-300"
        />
      </form>

      {status === "loading" ? (
        <span className="order-2 hidden shrink-0 items-center gap-2 text-[10px] text-slate-400 sm:flex">
          <Spinner label="Restoring account" />
          Restoring…
        </span>
      ) : user ? (
        <div className="order-2">
          <AccountMenu
            user={user}
            logout={logout}
            logoutPending={logoutPending}
          />
        </div>
      ) : (
        <div className="order-2 flex shrink-0 items-center gap-2">
          <button
            className="rounded-full bg-[#f23a23] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#d92e1a]"
            onClick={() => openAuth("register")}
          >
            Sign up
          </button>
          <button
            className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#101321] transition hover:bg-slate-200"
            onClick={() => openAuth("login")}
          >
            Log in
          </button>
        </div>
      )}
    </header>
  );
}
