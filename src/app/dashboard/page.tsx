"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initAuthListener, auth } from "../../lib/auth";
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Breadcrumb from "../../components/Breadcrumb";
import VersionNotesManager from "../../components/VersionNotesManager";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "version" | "timesheet">(
    "login"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tabLoaded, setTabLoaded] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  // Listen for fullscreen status changes from Firestore with live tracking
  useEffect(() => {
    let isActive = true;

    const checkFullscreenStatus = async () => {
      if (!isActive) return;

      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "userPreferences", user.uid);
          const docSnap = await getDoc(docRef);
          const isFullscreen =
            docSnap.exists() && docSnap.data().isFullscreenActive === true;
          setIsFullscreenActive(isFullscreen);
        } catch (error) {
          console.error("Error checking fullscreen status:", error);
        }
      }
    };

    // Initial check
    checkFullscreenStatus();

    // Poll every 500ms for very responsive tracking
    const interval = setInterval(checkFullscreenStatus, 500);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  // Manual clear function
  const clearFullscreenLock = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, "userPreferences", user.uid);
        await setDoc(docRef, { isFullscreenActive: false }, { merge: true });
        setIsFullscreenActive(false);
      } catch (error) {
        console.error("Error clearing fullscreen lock:", error);
      }
    }
  };

  useEffect(() => {
    const unsub = initAuthListener(async (user) => {
      setLoading(false);
      if (user) {
        setAuthorized(true);
        // Load last active tab from Firestore
        try {
          const docRef = doc(db, "userPreferences", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().lastActiveTab) {
            setActiveTab(docSnap.data().lastActiveTab);
          }
        } catch (error) {
          console.error("Error loading last active tab:", error);
        } finally {
          setTabLoaded(true);
        }
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // Save active tab to Firestore whenever it changes
  useEffect(() => {
    const saveActiveTab = async () => {
      const user = auth.currentUser;
      if (user && authorized && tabLoaded) {
        try {
          const docRef = doc(db, "userPreferences", user.uid);
          await setDoc(docRef, { lastActiveTab: activeTab }, { merge: true });
        } catch (error) {
          console.error("Error saving active tab:", error);
        }
      }
    };

    saveActiveTab();
  }, [activeTab, authorized, tabLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!authorized) return null;

  const menuItems = [
    { id: "login" as const, label: "Login/Logout", icon: "🔐" },
    { id: "timesheet" as const, label: "Timesheet", icon: "⏰" },
    { id: "version" as const, label: "Version Notes", icon: "📝" },
  ];

  // Get current active tab label
  const getActiveTabLabel = () => {
    const activeItem = menuItems.find((item) => item.id === activeTab);
    return activeItem?.label || "";
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "login":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold light:text-gray-900 dark:text-white">
              Login/Logout
            </h2>
            <p className="light:text-gray-600 dark:text-gray-400">
              Authentication management will be implemented here.
            </p>
          </div>
        );
      case "version":
        return (
          <div className="relative h-full flex flex-col">
            {/* Animated Fullscreen Prompt */}
            <div className="mb-4 p-3 rounded-lg light:bg-blue-50 dark:bg-blue-600/10 border light:border-blue-200 dark:border-blue-500/30 shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></div>
                  <p className="text-xs font-medium light:text-gray-900 dark:text-blue-400">
                    💡 Want to see in fullscreen?
                  </p>
                </div>
                <a
                  href="/version-manager-fullscreen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors font-semibold flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  Open Fullscreen
                </a>
              </div>
            </div>

            {/* Blur overlay when fullscreen is active */}
            {isFullscreenActive && (
              <div className="absolute inset-0 z-50 backdrop-blur-md rounded-lg flex items-center justify-center light:bg-white/90 dark:bg-black/90 pointer-events-auto">
                <div className="text-center p-8 rounded-lg light:bg-white dark:bg-gray-800 shadow-2xl border light:border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full light:bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 light:text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold light:text-gray-900 dark:text-white mb-2">
                    Opened in Fullscreen
                  </h3>
                  <p className="light:text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Version Notes Manager is currently open in fullscreen mode.
                    <br />
                    Close the fullscreen tab to edit here.
                  </p>
                  <button
                    onClick={clearFullscreenLock}
                    className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold"
                  >
                    🔓 Force Unlock (if stuck)
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <VersionNotesManager />
            </div>
          </div>
        );
      case "timesheet":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold light:text-gray-900 dark:text-white">
              Timesheet
            </h2>
            <p className="light:text-gray-600 dark:text-gray-400">
              Timesheet tracking will be implemented here.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <div className="shrink-0">
        <Navbar />
        <Breadcrumb activeTab={getActiveTabLabel()} />
      </div>
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Balanced minimal design */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-52 border-r light:border-gray-200 dark:border-white/10 p-3
            light:bg-white dark:bg-black/20
            transform transition-transform duration-300 ease-in-out
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
            overflow-y-auto
          `}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide light:text-gray-600 dark:text-white/60">
              Menu
            </h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden light:text-gray-600 dark:text-gray-400 light:hover:text-gray-900 dark:hover:text-white"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-150 flex items-center gap-2.5 text-sm ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "light:text-gray-700 dark:text-gray-300 light:hover:bg-gray-100 dark:hover:bg-white/5 light:hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 p-4 md:p-6 light:bg-gray-50 dark:bg-transparent overflow-hidden flex flex-col min-h-0">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="rounded-lg light:bg-white dark:bg-black/10 p-6 md:p-8 flex-1 flex flex-col overflow-hidden min-h-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
      <div className="shrink-0">
        <Footer />
      </div>
    </div>
  );
}
