"use client";

import React, { useState, useEffect } from "react";
import BrandLogo from "../../../components/BrandLogo";
import { signInWithGoogle } from "../../../lib/auth";
import { useRouter } from "next/navigation";
import { useLoading } from "../../../contexts/LoadingContext";
import { Shield, Zap, Sparkles } from "lucide-react";

export default function MobileLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { withLoading } = useLoading();

  // Prevent pull-to-refresh and scrolling on mobile
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Allow pinch zoom
      e.preventDefault();
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.removeEventListener("touchmove", preventDefault);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await withLoading(async () => {
      try {
        await signInWithGoogle();
        router.push("/dashboard");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, "Signing in...");
  };

  return (
    <div className="h-svh flex flex-col bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden fixed inset-0 w-full overscroll-none">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 right-10 w-48 h-48 bg-sky-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col p-4 min-h-0 overflow-y-auto overscroll-none relative z-10">
        {/* Top Branding Section */}
        <div className="text-center mb-4 shrink-0">
          <div className="flex items-center justify-center gap-3 mb-3">
            <BrandLogo className="w-12 h-12" />
            <div>
              <h1 className="text-xl font-bold bg-linear-to-r from-[#6366F1] via-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent">
                Gaurav Management Panel
              </h1>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            A secure, minimal control panel designed exclusively for personal
            management needs.
          </p>
        </div>

        {/* Middle Content - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            {/* Feature Highlights */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-sky-500/10 p-2 rounded-lg shrink-0">
                  <Shield className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    Secure Access
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Protected by Google OAuth with authorized user validation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-indigo-500/10 p-2 rounded-lg shrink-0">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    Fast & Responsive
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Built with Next.js 16 and optimized for performance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-violet-500/10 p-2 rounded-lg shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    Modern Interface
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Clean design with dark mode and smooth animations
                  </p>
                </div>
              </div>
            </div>

            {/* Auth Card */}
            <div className="w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/50 shadow-xl">
              <h2 className="text-lg font-semibold mb-1 bg-clip-text text-transparent bg-linear-to-r from-sky-400 to-indigo-400">
                Sign in to GMP
              </h2>
              <p className="text-xs text-gray-300 mb-4">
                Only authorized users may access.
              </p>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
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

              <p className="text-xs text-gray-400 mt-3 text-center">
                Sign in with your authorized Google account
              </p>
            </div>
          </div>
        </div>

        {/* Custom Dark Footer - Mobile - Bottom */}
        <footer className="w-full pt-4 pb-2 shrink-0">
          <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-gray-500" />
              <span>© {new Date().getFullYear()} GMP — Personal use only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Secure & Private</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
