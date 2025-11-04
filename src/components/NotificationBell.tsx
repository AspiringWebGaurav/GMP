"use client";

import React from "react";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  disabled?: boolean;
  count?: number; // Static count for now, can be made dynamic later
}

export default function NotificationBell({
  disabled = false,
  count = 3,
}: NotificationBellProps) {
  return (
    <button
      aria-label={`Notifications${count > 0 ? ` (${count})` : ""}`}
      title={
        disabled ? "Notifications coming soon" : `${count} new notifications`
      }
      disabled={disabled}
      className="relative p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 transition-all duration-200 group"
    >
      <Bell
        className="w-5 h-5 text-gray-300 group-hover:text-[#6EE7B7] transition-colors"
        aria-hidden
      />

      {/* Notification Badge */}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-[#3B82F6] rounded-full ring-2 ring-[#0b1220] shadow-lg shadow-[#3B82F6]/50 animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
