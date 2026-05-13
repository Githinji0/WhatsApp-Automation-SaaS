import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-8 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 shadow-2xl shadow-emerald-950/20 backdrop-blur md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
              WhatsApp Automation SaaS
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Clerk authentication is wired for the app shell.
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Create account
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
              Dashboard auth, session sync, and route protection
            </p>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Sign in once, then manage your WhatsApp automations safely.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              This frontend now supports Clerk sign-in and sign-up, protects the
              dashboard route, and is ready to send authenticated Bearer tokens
              to the backend.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Create your account
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Auth flow
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Clerk provider at the root, protected /dashboard routes, and
                  a sync endpoint to persist users into Supabase.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Next step
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Sign in, then the app will surface your dashboard and use the
                  session token for API calls.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}