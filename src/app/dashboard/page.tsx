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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "version" | "timesheet">(
    "login"
  );
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
          <div className="h-full flex flex-col overflow-hidden">
            {isMobile ? <TimeTrackerMobile /> : <TimeTracker />}
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

        {/* Left Sidebar - Compact minimal design */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-48 border-r light:border-gray-200 dark:border-white/10 p-4
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
          <div className="flex items-center justify-between mb-3">
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
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-150 flex items-center gap-2 text-sm ${
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

        {/* Right Content Area - Minimal compact spacing */}
        <div className="flex-1 p-4 light:bg-gray-50 dark:bg-transparent overflow-hidden flex flex-col min-h-0">
          <div className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="rounded light:bg-white dark:bg-black/10 p-4 flex-1 flex flex-col overflow-hidden min-h-0">
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
