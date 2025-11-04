"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initAuthListener, auth } from "../../lib/auth";
import { db } from "../../lib/firebase";
import { doc, setDoc, deleteField } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import VersionNotesManager from "../../components/VersionNotesManager";

export default function VersionManagerFullscreenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsub = initAuthListener(async (user) => {
      setLoading(false);
      if (user) {
        setAuthorized(true);
        // Set fullscreen active status in Firestore
        try {
          const docRef = doc(db, "userPreferences", user.uid);
          await setDoc(docRef, { isFullscreenActive: true }, { merge: true });
          console.log("✅ Fullscreen status set to TRUE");
        } catch (error) {
          console.error("Error setting fullscreen status:", error);
        }
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // Clean up fullscreen status when page unmounts or becomes hidden
  useEffect(() => {
    const clearFullscreenStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "userPreferences", user.uid);
          await setDoc(docRef, { isFullscreenActive: false }, { merge: true });
          console.log("🔓 Fullscreen status cleared");
        } catch (error) {
          console.error("Error clearing fullscreen status:", error);
        }
      }
    };

    // Clear when tab becomes hidden (user switches tabs or minimizes)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("📴 Page hidden, clearing fullscreen status");
        clearFullscreenStatus();
      } else {
        // When page becomes visible again, set status to true
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "userPreferences", user.uid);
          setDoc(docRef, { isFullscreenActive: true }, { merge: true });
          console.log("👁️ Page visible, setting fullscreen status to TRUE");
        }
      }
    };

    // Use pagehide instead of beforeunload for better reliability
    const handlePageHide = () => {
      console.log("👋 Page hiding, clearing fullscreen status");
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "userPreferences", user.uid);
        // Use navigator.sendBeacon for reliable cleanup when page closes
        const data = JSON.stringify({ isFullscreenActive: false });
        navigator.sendBeacon(`/api/clear-fullscreen?uid=${user.uid}`, data);
        // Also try regular method
        setDoc(docRef, { isFullscreenActive: false }, { merge: true });
      }
    };

    // Add event listeners for better tracking
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    // Clean up on unmount
    return () => {
      console.log("🧹 Component unmounting, clearing fullscreen status");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      clearFullscreenStatus();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center light:bg-gray-50 dark:bg-[#0f1724]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm light:text-gray-600 dark:text-gray-400">
            Loading fullscreen mode...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="h-screen flex flex-col light:bg-gray-50 dark:bg-[#0f1724] overflow-hidden">
      <div className="shrink-0">
        <Navbar />
      </div>

      <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-hidden flex flex-col min-h-0">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Fullscreen Header - Responsive */}
          <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 rounded-lg light:bg-white dark:bg-blue-600/10 border light:border-blue-200 dark:border-blue-500/30 shrink-0 shadow-sm light:shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                <p className="text-xs sm:text-sm font-semibold light:text-gray-900 dark:text-blue-400">
                  🖥️ Fullscreen Mode Active
                </p>
              </div>
              <p className="text-[10px] sm:text-xs light:text-gray-600 dark:text-gray-400 ml-5 sm:ml-0">
                Dashboard tab is locked while you work here
              </p>
            </div>
          </div>

          {/* Version Notes Manager - Non-scrollable wrapper, only history scrolls */}
          <div className="flex-1 overflow-hidden min-h-0">
            <VersionNotesManager />
          </div>
        </div>
      </main>
    </div>
  );
}
