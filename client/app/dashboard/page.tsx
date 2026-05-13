import Link from "next/link";

import { AuthMeCard } from "./auth-me-card";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Your authenticated workspace
            </h1>
          </div>
          <Link
            href="/sign-in"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Sign in
          </Link>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium">Authentication status</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Clerk will protect this route when the publishable key is set in
              deployment. The backend already accepts and verifies the session
              token.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium">Next integration</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The next step is wiring an authenticated fetch helper that
              automatically adds the Bearer token for API requests.
            </p>
          </div>
                </section>

        <section className="mt-6">
          <AuthMeCard />
        </section>
      </div>
    </main>
  );
}
