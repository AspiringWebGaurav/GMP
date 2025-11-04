"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogOut, User as UserIcon, Settings, Moon, Sun } from "lucide-react";
import BrandLogo from "./BrandLogo";
import NotificationBell from "./NotificationBell";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";

interface NavbarProps {
  showNotifications?: boolean;
}

export default function Navbar({ showNotifications = true }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Update clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const istTime = now.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setCurrentTime(istTime);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b light:border-gray-200 dark:border-white/5 light:bg-white/95 dark:bg-[#0b1220]/95 backdrop-blur-xl light:shadow-sm dark:shadow-lg dark:shadow-black/20">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left Section - Logo and Brand Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <BrandLogo className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm sm:text-base lg:text-lg bg-linear-to-r from-[#6EE7B7] to-[#3B82F6] bg-clip-text text-transparent whitespace-nowrap">
                Gaurav Management
              </span>
              <span className="hidden sm:block text-xs light:text-gray-600 dark:text-gray-400">
                Portfolio
              </span>
            </div>
          </div>

          {/* Middle Section - Live Clock (IST) */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg light:bg-gray-100 dark:bg-white/5 border light:border-gray-200 dark:border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-mono light:text-gray-700 dark:text-gray-300">
                {currentTime}
                <span className="text-xs light:text-gray-500 dark:text-gray-500 ml-1">
                  IST
                </span>
              </span>
            </div>
          </div>

          {/* Right Section - Notifications and Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg light:bg-gray-100 dark:bg-white/5 border light:border-gray-200 dark:border-white/10 light:hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              )}
            </button>

            {showNotifications && user && <NotificationBell />}

            {user && (
              <div className="relative" ref={profileMenuRef}>
                {/* Profile Picture */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-white/30 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6EE7B7]"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-[#6EE7B7] to-[#3B82F6] flex items-center justify-center">
                      <span className="font-semibold text-white text-xs sm:text-sm">
                        {user.displayName?.[0]?.toUpperCase() || "GP"}
                      </span>
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[#0f1729] border border-white/10 shadow-xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Add profile navigation if needed
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Add settings navigation if needed
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-white/10 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
