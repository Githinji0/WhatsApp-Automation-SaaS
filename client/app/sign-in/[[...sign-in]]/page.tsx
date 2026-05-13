import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_38%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-6 py-12 text-slate-50">
      <div className="w-full max-w-[420px] rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-slate-950/90 border border-white/10 shadow-none",
              headerTitle: "text-white text-2xl font-semibold",
              headerSubtitle: "text-slate-300",
              formButtonPrimary:
                "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold",
              footerActionLink: "text-emerald-300 hover:text-emerald-200",
              identityPreviewEditButtonIcon: "text-emerald-300",
            },
          }}
        />

        <div className="px-6 pb-6 pt-2 text-center">
          <Link
            href="/"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
}