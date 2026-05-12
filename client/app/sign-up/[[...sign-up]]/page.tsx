import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-50">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-semibold">Sign-up setup</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Add a valid Clerk publishable key in deployment to enable the hosted
          sign-up flow. The backend auth middleware and sync endpoint are ready.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}