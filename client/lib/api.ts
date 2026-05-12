"use client";

import { useAuth } from "@clerk/nextjs";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async function authenticatedFetch(input: string, init: RequestInit = {}) {
    const token = await getToken();

    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(input.startsWith("http") ? input : `${DEFAULT_BASE_URL}${input}`, {
      ...init,
      headers,
    });

    return response;
  };
}