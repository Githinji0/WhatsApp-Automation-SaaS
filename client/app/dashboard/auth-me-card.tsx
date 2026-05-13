"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@clerk/nextjs";

import { useAuthenticatedFetch } from "@/lib/api";

type AuthMeResponse = {
  user?: {
    clerkId?: string;
    email?: string | null;
    name?: string | null;
  };
  error?: {
    message?: string;
  };
};

export function AuthMeCard() {
  const { isLoaded, isSignedIn } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    data?: AuthMeResponse;
    message?: string;
  }>({ status: "idle" });

  useEffect(() => {
    let isMounted = true;

    async function loadAuthMe() {
      if (!isLoaded || !isSignedIn) {
        return;
      }

      setState({ status: "loading" });

      try {
        const response = await authenticatedFetch("/auth/me");
        const data = (await response.json()) as AuthMeResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setState({
            status: "error",
            data,
            message: data.error?.message || "Failed to load auth details",
          });
          return;
        }

        setState({ status: "success", data });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unexpected error",
        });
      }
    }

    loadAuthMe();

    return () => {
      isMounted = false;
    };
  }, [authenticatedFetch, isLoaded, isSignedIn]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-medium">/auth/me demo</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        This card calls the server with the Clerk session token and shows the
        authenticated profile returned by <span className="font-medium text-white">/auth/me</span>.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
        {state.status === "idle" && "Waiting for Clerk to finish loading..."}
        {state.status === "loading" && "Loading authenticated user..."}
        {state.status === "success" && (
          <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-200">
            {JSON.stringify(state.data?.user ?? state.data, null, 2)}
          </pre>
        )}
        {state.status === "error" && (
          <div className="space-y-2 text-rose-200">
            <p>{state.message}</p>
            {state.data && (
              <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-rose-100/90">
                {JSON.stringify(state.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
