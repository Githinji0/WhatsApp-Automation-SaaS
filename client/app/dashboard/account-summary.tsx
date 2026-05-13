"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";

export function AccountSummary() {
  const { isLoaded, isSignedIn, user } = useUser();

  const displayName = user?.fullName || user?.username || "WhatsApp operator";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 via-white/5 to-slate-900/70 p-6 shadow-xl shadow-emerald-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
            Account
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {isLoaded ? (isSignedIn ? `Welcome back, ${displayName}` : "Welcome") : "Loading account..."}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {isLoaded && isSignedIn
              ? email || "Your Clerk session is active and authenticated."
              : "Your dashboard will show your signed-in identity and session info here."}
          </p>
        </div>

        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Sign out
          </button>
        </SignOutButton>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Session
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">
            {isLoaded ? (isSignedIn ? "Authenticated" : "Signed out") : "Loading"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Name
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">{displayName}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Email
          </p>
          <p className="mt-2 break-words text-sm font-medium text-slate-100">
            {email || "Not available yet"}
          </p>
        </div>
      </div>
    </div>
  );
}