import React from "react";
import VersionWithChangelog from "./VersionWithChangelog";
import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm">
      <div className="w-full px-6 py-6">
        {/* Desktop & Tablet Layout */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {/* Left: Content */}
          <div className="text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">
              Made exclusively for Gaurav
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              © {year} GMP — Personal use only
            </p>
          </div>

          {/* Center: Status/Tagline */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-zinc-400">System Active</span>
            </div>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">Secure & Private</span>
          </div>

          {/* Right: Version & Social */}
          <div className="flex items-center gap-4">
            {/* Version */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Version:</span>
              <VersionWithChangelog />
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://linkedin.com/in/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4 text-zinc-400 group-hover:text-sky-400 transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 sm:hidden">
          {/* Top Row: Content */}
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">
              Made exclusively for Gaurav
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              © {year} GMP — Personal use only
            </p>
          </div>

          {/* Bottom Row: Social & Version */}
          <div className="flex items-center justify-between">
            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="https://linkedin.com/in/gauravpatil9262"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4 text-zinc-400 group-hover:text-sky-400 transition-colors" />
              </a>
            </div>

            {/* Version */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">v:</span>
              <VersionWithChangelog />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
