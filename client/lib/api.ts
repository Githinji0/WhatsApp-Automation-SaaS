"use client";

import { useCallback } from "react";

import { useAuth } from "@clerk/nextjs";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async function authenticatedFetch(input: string, init: RequestInit = {}) {
      async function performFetch(skipCache = false) {
        const token = await getToken(skipCache ? { skipCache: true } : undefined);

        const headers = new Headers(init.headers);
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        if (!headers.has("Content-Type") && init.body) {
          headers.set("Content-Type", "application/json");
        }

        return fetch(input.startsWith("http") ? input : `${DEFAULT_BASE_URL}${input}`, {
          ...init,
          headers,
        });
      }

      const response = await performFetch(false);

      if (response.status !== 401) {
        return response;
      }

      return performFetch(true);
    },
    [getToken]
  );
}