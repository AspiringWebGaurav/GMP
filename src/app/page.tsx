"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initAuthListener, ALLOWED_EMAIL } from "../lib/auth";
import type { User } from "firebase/auth";
import { useLoading } from "@/contexts/LoadingContext";

export default function Home() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    startLoading("Checking authentication...");

    // Client redirect fallback: initialize auth listener and redirect accordingly
    const unsub = initAuthListener((user: User | null) => {
      if (user && user.email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      stopLoading();
    });

    return () => {
      unsub();
      stopLoading();
    };
  }, [router, startLoading, stopLoading]);

  return null;
}
