"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Trash2, CheckCheck } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Notification } from "@/types/notification";
import { formatDistanceToNow } from "@/lib/utils";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    const baseClasses =
      "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0";

    switch (type) {
      case "login":
        return (
          <div className={`${baseClasses} bg-green-500/10 text-green-400`}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
      case "logout":
        return (
          <div className={`${baseClasses} bg-orange-500/10 text-orange-400`}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
      case "timesheet":
        return (
          <div className={`${baseClasses} bg-blue-500/10 text-blue-400`}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
      case "version":
        return (
          <div className={`${baseClasses} bg-purple-500/10 text-purple-400`}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
      case "error":
        return (
          <div className={`${baseClasses} bg-red-500/10 text-red-400`}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
      case "success":
        return (
          <div className={`${baseClasses} bg-green-500/10 text-green-400`}>
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-500/10 text-gray-400`}>
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${
          unreadCount > 0 ? ` (${unreadCount})` : ""
        }`}
        className="relative p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all duration-200 group"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 group-hover:text-[#3B82F6] transition-colors" />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-[#3B82F6] rounded-full ring-2 ring-white shadow-lg shadow-[#3B82F6]/50 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 md:w-[420px] max-h-[70vh] sm:max-h-[600px] bg-white border border-gray-200 rounded-lg shadow-2xl shadow-gray-300/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 backdrop-blur-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>

            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[calc(70vh-80px)] sm:max-h-[520px] bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-12 bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-white">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3" />
                <p className="text-sm sm:text-base text-gray-600 text-center">
                  No notifications yet
                </p>
                <p className="text-xs sm:text-sm text-gray-500 text-center mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 bg-white">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-3 sm:px-4 py-3 sm:py-4 cursor-pointer transition-all duration-200 ${
                      notification.read
                        ? "bg-white hover:bg-gray-50"
                        : "bg-blue-50 hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex gap-2.5 sm:gap-3">
                      {/* Icon */}
                      {getNotificationIcon(notification.type)}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              notification.read
                                ? "text-gray-700"
                                : "text-gray-900"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {formatDistanceToNow(notification.createdAt)}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
