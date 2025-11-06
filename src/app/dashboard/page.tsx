"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initAuthListener } from "../../lib/auth";
import { db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Breadcrumb from "../../components/Breadcrumb";
import VersionNotesManager from "../../components/VersionNotesManager";
import VersionNotesManagerMobile from "../../components/VersionNotesManagerMobile";
import TimeTracker from "../../components/TimeTracker";
import TimeTrackerMobile from "../../components/TimeTrackerMobile";
import ModernTimesheet from "../../components/ModernTimesheet";
import ModernTimesheetMobile from "../../components/ModernTimesheetMobile";
import TodoList from "../../components/TodoList";
import TodoListMobile from "../../components/TodoListMobile";
import RecycleBin from "../../components/RecycleBin";
import RecycleBinMobile from "../../components/RecycleBinMobile";
import { useLoading } from "../../contexts/LoadingContext";

export default function DashboardPage() {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "login" | "version" | "timesheet" | "todo" | "recycle"
  >("login");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tabLoaded, setTabLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    startLoading("Loading dashboard...");
    const unsub = initAuthListener(async (user) => {
      setLoading(false);
      if (user) {
        setAuthorized(true);
        setCurrentUserId(user.uid); // Store user ID
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
          stopLoading();
        }
      } else {
        stopLoading();
        router.replace("/login");
      }
    });
    return () => {
      unsub();
      stopLoading();
    };
  }, [router, startLoading, stopLoading]);

  // Save active tab to Firestore whenever it changes
  useEffect(() => {
    const saveActiveTab = async () => {
      if (authorized && tabLoaded && currentUserId) {
        try {
          const docRef = doc(db, "userPreferences", currentUserId); // Use actual user ID
          await setDoc(docRef, { lastActiveTab: activeTab }, { merge: true });
        } catch (error) {
          console.error("Error saving active tab:", error);
        }
      }
    };

    saveActiveTab();
  }, [activeTab, authorized, tabLoaded, currentUserId]);

  if (loading) {
    return null;
  }

  if (!authorized) return null;

  const menuItems = [
    { id: "login" as const, label: "Login/Logout", icon: "🔐" },
    { id: "recycle" as const, label: "Recycle Bin", icon: "♻️" },
    { id: "timesheet" as const, label: "Timesheet", icon: "⏰" },
    { id: "todo" as const, label: "TODO List", icon: "✅" },
  ];

  // Desktop menu items (without Recycle Bin)
  const desktopMenuItems = menuItems.filter((item) => item.id !== "recycle");

  // Get current active tab label
  const getActiveTabLabel = () => {
    if (activeTab === "version") return "Version Notes";
    const activeItem = menuItems.find((item) => item.id === activeTab);
    return activeItem?.label || "";
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "login":
        return (
          <div className="h-full flex flex-col overflow-hidden">
            {isMobile ? <TimeTrackerMobile /> : <TimeTracker />}
          </div>
        );
      case "recycle":
        return (
          <div className="h-full flex flex-col overflow-hidden">
            {isMobile ? <RecycleBinMobile /> : <RecycleBin />}
          </div>
        );
      case "version":
        return (
          <div className="h-full">
            {isMobile ? <VersionNotesManagerMobile /> : <VersionNotesManager />}
          </div>
        );
      case "timesheet":
        return (
          <div className="h-full flex flex-col overflow-hidden">
            {isMobile ? <ModernTimesheetMobile /> : <ModernTimesheet />}
          </div>
        );
      case "todo":
        return (
          <div className="h-full flex flex-col overflow-hidden">
            {isMobile ? <TodoListMobile /> : <TodoList />}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <div className="shrink-0">
        <Navbar onVersionNotesClick={() => setActiveTab("version")} />
        <Breadcrumb activeTab={getActiveTabLabel()} />
      </div>
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Mobile Menu Button - Compact FAB (only visible on mobile) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-5 right-5 z-50 bg-linear-to-br from-blue-600 to-indigo-700 text-white p-3.5 rounded-xl shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
          aria-label="Toggle menu"
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isSidebarOpen ? "rotate-90" : "rotate-0"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ease-in-out"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* MOBILE DRAWER - Beautiful animated drawer (visible only on mobile) */}
        <aside
          className={`
            lg:hidden
            fixed inset-y-0 left-0 z-40
            w-64 border-r border-gray-200
            bg-white
            transform transition-all duration-300 ease-out
            ${isSidebarOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}
            flex flex-col
          `}
        >
          {/* Mobile Header */}
          <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-linear-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  G
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Gaurav</h3>
                  <p className="text-[10px] text-gray-500">Management</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-white/80 rounded-md transition-all duration-200"
                aria-label="Close menu"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
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
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2.5 group ${
                    activeTab === item.id
                      ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/25"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  style={{
                    animationDelay: `${index * 40}ms`,
                    animation: isSidebarOpen
                      ? "slideInLeft 0.3s ease-out forwards"
                      : "none",
                  }}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {activeTab === item.id && (
                    <svg
                      className="w-3.5 h-3.5 ml-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Logout */}
          <div className="shrink-0 px-3 pb-3">
            <button
              onClick={async () => {
                const { signOut } = await import("../../lib/auth");
                await signOut();
                router.replace("/login");
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-linear-to-r from-red-500 to-rose-600 text-white text-sm font-medium shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Version */}
          <div className="shrink-0 px-3 pb-2">
            <div className="bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-600">
                  Version
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[11px] font-semibold text-gray-900">
                    {(() => {
                      const { VERSION } = require("../config/version");
                      return VERSION;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="shrink-0 px-3 pb-3 border-t border-gray-100 pt-2">
            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5">
                <a
                  href="https://github.com/gauravpatil9262"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-gray-100 hover:bg-gray-900 hover:text-white rounded-md transition-all duration-200 hover:scale-110"
                  aria-label="GitHub"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/in/gauravpatil9262"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-md transition-all duration-200 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
              <p className="text-[9px] font-medium text-gray-900">
                Made for Gaurav{" "}
                <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-purple-100 text-purple-700">
                  PRIVATE
                </span>
              </p>
              <p className="text-[9px] text-gray-500">
                © {new Date().getFullYear()} GMP
              </p>
            </div>
          </div>
        </aside>

        {/* DESKTOP SIDEBAR - Simple compact sidebar (visible only on desktop) */}
        <aside className="hidden lg:block w-48 border-r border-gray-200 p-4 bg-white overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Menu
            </h3>
          </div>
          <nav className="space-y-1">
            {desktopMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-150 flex items-center gap-2 text-sm ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <style jsx>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        {/* Right Content Area - Minimal compact spacing */}
        <div className="flex-1 p-4 bg-gray-50 overflow-hidden flex flex-col min-h-0">
          <div className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="rounded bg-white p-4 flex-1 flex flex-col overflow-hidden min-h-0">
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
