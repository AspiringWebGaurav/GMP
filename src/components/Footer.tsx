import React from "react";
import VersionWithChangelog from "./VersionWithChangelog";
import { Github, Linkedin, Shield, Zap } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t light:border-gray-200 dark:border-white/10 light:bg-white dark:bg-black backdrop-blur-lg">
      <div className="w-full px-6 py-3">
        {/* Desktop & Tablet Layout */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {/* Left: Content with Icon */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg light:bg-blue-50 dark:bg-blue-500/10 border light:border-blue-200 dark:border-blue-500/20">
              <Shield className="w-4 h-4 light:text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm">
              <p className="font-semibold light:text-gray-900 dark:text-white flex items-center gap-2">
                Made exclusively for Gaurav
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full light:bg-purple-100 dark:bg-purple-500/20 light:text-purple-700 dark:text-purple-400">
                  PRIVATE
                </span>
              </p>
              <p className="text-xs light:text-gray-500 dark:text-gray-400 mt-0.5">
                © {year} GMP — Personal use only
              </p>
            </div>
          </div>

          {/* Center: Enhanced Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg light:bg-green-50 dark:bg-green-500/10 border light:border-green-200 dark:border-green-500/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium light:text-green-700 dark:text-green-400">
                System Active
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg light:bg-blue-50 dark:bg-blue-500/10 border light:border-blue-200 dark:border-blue-500/20">
              <Zap className="w-3.5 h-3.5 light:text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium light:text-blue-700 dark:text-blue-400">
                Secure & Private
              </span>
            </div>
          </div>

          {/* Right: Version & Social with Enhanced Design */}
          <div className="flex items-center gap-4">
            {/* Version with Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg light:bg-gray-100 dark:bg-white/5 border light:border-gray-200 dark:border-white/10">
              <span className="text-xs font-medium light:text-gray-600 dark:text-gray-400">
                Version:
              </span>
              <VersionWithChangelog />
            </div>

            {/* Social Links with Enhanced Design */}
            <div className="flex items-center gap-1.5">
              <a
                href="https://github.com/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 light:bg-gray-100 dark:bg-white/5 light:hover:bg-gray-900 dark:hover:bg-white light:hover:text-white dark:hover:text-black rounded-lg transition-all duration-200 border light:border-gray-200 dark:border-white/10 group hover:scale-105"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4 light:text-gray-700 dark:text-gray-300 light:group-hover:text-white dark:group-hover:text-black transition-colors" />
              </a>
              <a
                href="https://linkedin.com/in/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 light:bg-gray-100 dark:bg-white/5 light:hover:bg-blue-600 dark:hover:bg-blue-500 light:hover:text-white dark:hover:text-white rounded-lg transition-all duration-200 border light:border-gray-200 dark:border-white/10 group hover:scale-105"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4 light:text-gray-700 dark:text-gray-300 light:group-hover:text-white dark:group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Enhanced */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Top Row: Content with Badge */}
          <div className="flex items-center justify-center gap-2">
            <div className="p-1.5 rounded-lg light:bg-blue-50 dark:bg-blue-500/10 border light:border-blue-200 dark:border-blue-500/20">
              <Shield className="w-3.5 h-3.5 light:text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold light:text-gray-900 dark:text-white flex items-center gap-2">
                Made exclusively for Gaurav
                <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full light:bg-purple-100 dark:bg-purple-500/20 light:text-purple-700 dark:text-purple-400">
                  PRIVATE
                </span>
              </p>
              <p className="text-xs light:text-gray-500 dark:text-gray-400 mt-0.5">
                © {year} GMP — Personal use only
              </p>
            </div>
          </div>

          {/* Bottom Row: Social & Version with Status */}
          <div className="flex items-center justify-between gap-2">
            {/* Social Links */}
            <div className="flex items-center gap-1.5">
              <a
                href="https://github.com/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 light:bg-gray-100 dark:bg-white/5 light:hover:bg-gray-900 dark:hover:bg-white rounded-lg transition-all border light:border-gray-200 dark:border-white/10 group"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4 light:text-gray-700 dark:text-gray-300 light:group-hover:text-white dark:group-hover:text-black transition-colors" />
              </a>
              <a
                href="https://linkedin.com/in/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 light:bg-gray-100 dark:bg-white/5 light:hover:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-all border light:border-gray-200 dark:border-white/10 group"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4 light:text-gray-700 dark:text-gray-300 light:group-hover:text-white dark:group-hover:text-white transition-colors" />
              </a>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg light:bg-green-50 dark:bg-green-500/10 border light:border-green-200 dark:border-green-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-medium light:text-green-700 dark:text-green-400">
                ACTIVE
              </span>
            </div>

            {/* Version */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg light:bg-gray-100 dark:bg-white/5 border light:border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-medium light:text-gray-600 dark:text-gray-400">
                v:
              </span>
              <VersionWithChangelog />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
