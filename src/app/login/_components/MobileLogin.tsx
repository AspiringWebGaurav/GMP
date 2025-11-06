"use client";

import React, { useState } from "react";
import Link from "next/link";
import BrandLogo from "../../../components/BrandLogo";
import Breadcrumb from "../../../components/Breadcrumb";
import Footer from "../../../components/Footer";
import { signInWithGoogle } from "../../../lib/auth";
import { useRouter } from "next/navigation";

export default function MobileLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-gray-50">
      <Breadcrumb />
      <div className="flex-1 flex flex-col p-4 justify-between">
        <div>
          {/* Branding */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <BrandLogo className="w-14 h-14" />
              <div>
                <h1 className="text-2xl font-bold">GMP</h1>
                <p className="text-sm text-zinc-400">management portfolio</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Secure control panel for personal management — authorized access
              only.
            </p>
          </div>

          {/* Auth Card */}
          <div className="w-full bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/50 shadow-xl">
            <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-linear-to-r from-sky-400 to-indigo-400">
              Sign in to GMP
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Only authorized users may access.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-60 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <p className="text-xs text-zinc-500 mt-4 text-center">
              Sign in with your authorized Google account
            </p>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
