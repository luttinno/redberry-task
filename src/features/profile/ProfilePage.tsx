import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { ScreenLoader, Spinner } from "../../components/ui/Spinner";
import { mapApiErrors } from "../forms/mapApiErrors";
import { useAuth } from "../auth/context/useAuth";
import { useUpdateProfile, useVenues } from "./useProfile";
import {
  profileSchema,
  type ProfileFormValues,
  type ProfileSubmission,
} from "./profileSchema";

function getMaxBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 12);
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, "0"),
    `${date.getDate()}`.padStart(2, "0"),
  ].join("-");
}

function ProfileField({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
}) {
  const errorId = `${name}-error`;
  return (
    <div className="grid gap-1.5">
      <label
        className="text-[10px] font-semibold text-slate-200"
        htmlFor={name}
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-[10px] text-[#ff604c]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-transparent bg-[#202232] px-3 text-[11px] text-white outline-none transition placeholder:text-slate-500 focus:border-slate-500";
const invalidInputClass = "!border-[#f23825]";

export default function ProfilePage() {
  const { user, status, requireAuth } = useAuth();
  const location = useLocation();
  const venues = useVenues();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const form = useForm<ProfileFormValues, unknown, ProfileSubmission>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      mobileNumber: "",
      dateOfBirth: "",
      preferredVenueId: "",
    },
  });
  const { reset } = form;

  useEffect(() => {
    if (status === "guest") requireAuth(() => navigate("/profile"));
  }, [navigate, requireAuth, status]);

  useEffect(() => {
    if (!user) return;
    reset({
      fullName: user.fullName ?? "",
      mobileNumber: user.mobileNumber ?? "",
      dateOfBirth: user.dateOfBirth ?? "",
      preferredVenueId: user.preferredVenue
        ? String(user.preferredVenue.id)
        : "",
    });
  }, [reset, user]);

  const submit = form.handleSubmit((values) => {
    setFormNotice("");
    requireAuth(async () => {
      try {
        const updatedUser = await updateProfile.mutateAsync(values);
        form.reset(values);
        toast.success("Profile saved.");
        const routeState = location.state as {
          returnTo?: string;
          backgroundLocation?: unknown;
        } | null;
        const returnTo = routeState?.returnTo;
        if (
          updatedUser.profileComplete &&
          returnTo?.startsWith("/sessions/") &&
          returnTo.endsWith("/seats")
        ) {
          navigate(returnTo, {
            replace: true,
            state: routeState?.backgroundLocation
              ? { backgroundLocation: routeState.backgroundLocation }
              : null,
          });
        }
      } catch (error) {
        setFormNotice(
          mapApiErrors(error, form.setError, {
            fullName: "fullName",
            mobileNumber: "mobileNumber",
            dateOfBirth: "dateOfBirth",
            preferredVenueId: "preferredVenueId",
          }),
        );
      }
    });
  });

  const onSearchSubmit = () => navigate("/", { state: { search } });

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#070c1c] text-white">
        <SiteHeader
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={onSearchSubmit}
        />
        <ScreenLoader label="Restoring your account…" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col bg-[#070c1c] text-white">
        <SiteHeader
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={onSearchSubmit}
        />
        <section className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-black">
              Sign in to view your profile
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Your profile is available after authentication.
            </p>
            <button
              className="mt-6 rounded-full bg-[#f23a23] px-5 py-2.5 text-xs font-bold"
              onClick={() => requireAuth(() => navigate("/profile"))}
            >
              Log in
            </button>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#070c1c] text-white">
      <SiteHeader
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={onSearchSubmit}
      />
      <div className="mx-auto w-full max-w-375 flex-1 px-6 pb-12 pt-4 sm:px-10 lg:px-12">
        <h1 className="text-lg font-black">My Profile</h1>
        <nav
          className="mt-4 flex gap-6 border-b border-white/8"
          aria-label="Profile sections"
        >
          <NavLink
            to="/profile"
            end
            className={({ isActive }) =>
              `relative pb-3 text-[10px] font-medium ${isActive ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#f23a23]" : "text-slate-400 hover:text-white"}`
            }
          >
            Personal Information
          </NavLink>
          <NavLink
            to="/tickets"
            className={({ isActive }) =>
              `relative pb-3 text-[10px] font-medium ${isActive ? "text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#f23a23]" : "text-slate-400 hover:text-white"}`
            }
          >
            My Tickets
          </NavLink>
        </nav>

        <section className="max-w-135 pt-7">
          {!user.profileComplete && (
            <div
              className="mb-6 rounded-md border border-amber-300/20 bg-amber-300/[0.07] px-4 py-3 text-xs text-amber-200"
              role="status"
            >
              Please complete your profile to enable booking.
            </div>
          )}
          {user.profileComplete && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-md bg-emerald-400/10 px-3 py-2 text-[10px] font-bold text-emerald-300">
                Profile Complete ✓
              </span>
              {typeof user.age === "number" && (
                <span className="text-[10px] text-slate-400">
                  {user.age >= 18
                    ? `You are ${user.age}, you can buy tickets for all age ratings.`
                    : `You are ${user.age}; age restrictions will be applied to your account.`}
                </span>
              )}
            </div>
          )}

          <form className="grid gap-4" onSubmit={submit} noValidate>
            <ProfileField
              label="Full name"
              name="fullName"
              error={form.formState.errors.fullName?.message}
            >
              <input
                id="fullName"
                autoComplete="name"
                className={`${inputClass} ${form.formState.errors.fullName ? invalidInputClass : ""}`}
                aria-invalid={Boolean(form.formState.errors.fullName)}
                aria-describedby={
                  form.formState.errors.fullName ? "fullName-error" : undefined
                }
                {...form.register("fullName")}
              />
            </ProfileField>

            <ProfileField label="Email" name="profileEmail">
              <input
                id="profileEmail"
                type="email"
                value={user.email}
                readOnly
                className={`${inputClass} cursor-not-allowed text-slate-400`}
              />
              <span className="text-[9px] text-slate-500">
                Set at registration and cannot be changed.
              </span>
            </ProfileField>

            <ProfileField
              label="Mobile number"
              name="mobileNumber"
              error={form.formState.errors.mobileNumber?.message}
            >
              <input
                id="mobileNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="599 123 456"
                className={`${inputClass} ${form.formState.errors.mobileNumber ? invalidInputClass : ""}`}
                aria-invalid={Boolean(form.formState.errors.mobileNumber)}
                aria-describedby={
                  form.formState.errors.mobileNumber
                    ? "mobileNumber-error"
                    : undefined
                }
                {...form.register("mobileNumber")}
              />
            </ProfileField>

            <ProfileField
              label="Date of birth"
              name="dateOfBirth"
              error={form.formState.errors.dateOfBirth?.message}
            >
              <input
                id="dateOfBirth"
                type="date"
                max={getMaxBirthDate()}
                className={`${inputClass} scheme-dark ${form.formState.errors.dateOfBirth ? invalidInputClass : ""}`}
                aria-invalid={Boolean(form.formState.errors.dateOfBirth)}
                aria-describedby={
                  form.formState.errors.dateOfBirth
                    ? "dateOfBirth-error"
                    : undefined
                }
                {...form.register("dateOfBirth")}
              />
            </ProfileField>

            <ProfileField
              label="Preferred venue (optional)"
              name="preferredVenueId"
              error={form.formState.errors.preferredVenueId?.message}
            >
              <select
                id="preferredVenueId"
                className={`${inputClass} ${form.formState.errors.preferredVenueId ? invalidInputClass : ""}`}
                aria-invalid={Boolean(form.formState.errors.preferredVenueId)}
                aria-describedby={
                  form.formState.errors.preferredVenueId
                    ? "preferredVenueId-error"
                    : undefined
                }
                {...form.register("preferredVenueId")}
              >
                <option value="">Choose a venue</option>
                {venues.data?.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} · {venue.city}
                  </option>
                ))}
              </select>
              {venues.isError && (
                <ErrorState
                  message="Could not load venues."
                  onRetry={() => void venues.refetch()}
                  variant="compact"
                />
              )}
            </ProfileField>

            {formNotice && (
              <p className="text-[11px] text-[#ff604c]" role="status">
                {formNotice}
              </p>
            )}
            <button
              type="submit"
              disabled={
                !form.formState.isDirty ||
                !form.formState.isValid ||
                updateProfile.isPending
              }
              className="mt-1 w-fit rounded-full bg-[#f23a23] px-5 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#d92e1a] disabled:cursor-not-allowed disabled:bg-[#3b3c49] disabled:text-slate-300"
            >
              {updateProfile.isPending && <Spinner label="Saving profile" />}
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
