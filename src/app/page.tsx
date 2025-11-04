"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initAuthListener } from "../lib/auth";
import type { User } from "firebase/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client redirect fallback: initialize auth listener and redirect accordingly
    const unsub = initAuthListener((user: User | null) => {
      if (user && user.email === "gauravpatil9262@gmail.com") {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  return <div className="min-h-screen" />;
}
