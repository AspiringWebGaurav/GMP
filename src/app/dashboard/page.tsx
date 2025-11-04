"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initAuthListener } from "../../lib/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsub = initAuthListener((user) => {
      setLoading(false);
      if (user) {
        setAuthorized(true);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl p-6">
        {/* Empty dashboard shell */}
        <div className="rounded-lg border border-white/5 p-6">
          Welcome to GMP Dashboard (empty)
        </div>
      </main>
      <Footer />
    </div>
  );
}
