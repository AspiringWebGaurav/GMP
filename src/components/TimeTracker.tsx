"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, Trash2, Edit2, Check, X } from "lucide-react";
import {
  createTimesheetNotification,
  createErrorNotification,
} from "@/lib/notificationHelpers";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { useLoading } from "@/contexts/LoadingContext";

interface TimeLog {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime: string | null;
  workHours: number;
  createdAt: string;
}

export default function TimeTracker() {
  const { moveToRecycleBin } = useRecycleBin();
  const { withLoading } = useLoading();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [manualLoginTime, setManualLoginTime] = useState("");
  const [manualLogoutTime, setManualLogoutTime] = useState("");
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLogin, setEditLogin] = useState("");
  const [editLogout, setEditLogout] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchLogs();
    }
  }, [currentUserId, dateRange]);

  const fetchLogs = async () => {
    if (!currentUserId) return;
    setFetchingLogs(true);

    await withLoading(async () => {
      try {
        const response = await fetch(`/api/time-logs?userId=${currentUserId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(errorData.details || "Failed to fetch logs");
        }

        const data = await response.json();
        const allLogs = data.logs || [];

        // Client-side date filtering
        const filtered = allLogs.filter((log: TimeLog) => {
          const logDate = new Date(log.loginTime);
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);
          return logDate >= start && logDate <= end;
        });

        setLogs(filtered);
      } catch (error: any) {
        console.error("Error fetching logs:", error);
        await createErrorNotification(
          error.message || "Failed to load time logs",
          "Time Tracker"
        );
        setLogs([]);
      } finally {
        setFetchingLogs(false);
      }
    }, "Loading time logs...");
  };

  const handlePunchIn = () => {
    const now = new Date();
    const formatted = formatDateTimeLocal(now);
    setManualLoginTime(formatted);
  };

  const handlePunchOut = () => {
    const now = new Date();
    const formatted = formatDateTimeLocal(now);
    setManualLogoutTime(formatted);
  };

  const handleSubmitLog = async () => {
    if (!currentUserId || !manualLoginTime) {
      toast.error("Please enter login time");
      return;
    }

    setLoading(true);

    await withLoading(async () => {
      try {
        const response = await fetch("/api/time-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            loginTime: new Date(manualLoginTime).toISOString(),
            logoutTime: manualLogoutTime
              ? new Date(manualLogoutTime).toISOString()
              : null,
          }),
        });

        if (!response.ok) throw new Error("Failed to create log");

        await createTimesheetNotification("add", {
          loginTime: manualLoginTime,
        });
        setManualLoginTime("");
        setManualLogoutTime("");
        await fetchLogs();
      } catch (error: any) {
        console.error("Error creating log:", error);
        await createErrorNotification(
          "Failed to save time log",
          "Time Tracker"
        );
      } finally {
        setLoading(false);
      }
    }, "Saving time log...");
  };

  const handleUpdateLog = async (id: string) => {
    if (!editLogin) {
      toast.error("Login time is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/time-logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          loginTime: new Date(editLogin).toISOString(),
          logoutTime: editLogout ? new Date(editLogout).toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update log");

      await createTimesheetNotification("update", { id, loginTime: editLogin });
      setEditingId(null);
      setEditLogin("");
      setEditLogout("");
      await fetchLogs();
    } catch (error: any) {
      console.error("Error updating log:", error);
      await createErrorNotification("Failed to update log", "Time Tracker");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    const logToDelete = logs.find((log) => log.id === id);
    if (!logToDelete) return;

    if (!confirm("Move this log to Recycle Bin?")) return;

    setLoading(true);
    try {
      // First delete from backend
      const response = await fetch(`/api/time-logs?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete log");

      // Move to recycle bin
      await moveToRecycleBin("time-tracker", logToDelete, id);
      await createTimesheetNotification("delete", { id });
      await fetchLogs();
    } catch (error: any) {
      console.error("Error deleting log:", error);
      await createErrorNotification("Failed to delete log", "Time Tracker");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (log: TimeLog) => {
    setEditingId(log.id);
    setEditLogin(formatDateTimeLocal(new Date(log.loginTime)));
    setEditLogout(
      log.logoutTime ? formatDateTimeLocal(new Date(log.logoutTime)) : ""
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLogin("");
    setEditLogout("");
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDisplayTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateStats = () => {
    const completedLogs = logs.filter((log) => log.logoutTime);
    const totalHours = completedLogs.reduce(
      (sum, log) => sum + log.workHours,
      0
    );
    const avgHours =
      completedLogs.length > 0 ? totalHours / completedLogs.length : 0;
    return {
      totalHours: totalHours.toFixed(1),
      avgHours: avgHours.toFixed(1),
      sessions: completedLogs.length,
    };
  };

  const getDailyData = () => {
    const dailyMap = new Map<string, number>();
    logs.forEach((log) => {
      if (log.logoutTime) {
        const date = new Date(log.loginTime).toISOString().split("T")[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + log.workHours);
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  };

  const stats = calculateStats();
  const dailyData = getDailyData();
  const maxHours = Math.max(...dailyData.map((d) => d.hours), 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-hidden">
      {/* Left Panel - Add New Log */}
      <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-base font-semibold text-gray-900 mb-3 shrink-0">
          Track Time
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
          {/* Punch In */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">
                Login Time *
              </label>
              <button
                onClick={handlePunchIn}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
              >
                <LogIn className="w-3 h-3" />
                Punch In
              </button>
            </div>
            <label htmlFor="login-time" className="sr-only">
              Login Time
            </label>
            <input
              id="login-time"
              type="datetime-local"
              value={manualLoginTime}
              onChange={(e) => setManualLoginTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Punch Out */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">
                Logout Time
              </label>
              <button
                onClick={handlePunchOut}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-all disabled:opacity-50"
              >
                <LogOut className="w-3 h-3" />
                Punch Out
              </button>
            </div>
            <label htmlFor="logout-time" className="sr-only">
              Logout Time
            </label>
            <input
              id="logout-time"
              type="datetime-local"
              value={manualLogoutTime}
              onChange={(e) => setManualLogoutTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSubmitLog}
            disabled={loading || !manualLoginTime}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Time Log"}
          </button>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
            <div className="text-center p-2 rounded bg-blue-50">
              <p className="text-xs text-blue-700 font-medium">Total Hrs</p>
              <p className="text-lg font-bold text-blue-900">
                {stats.totalHours}
              </p>
            </div>
            <div className="text-center p-2 rounded bg-purple-50">
              <p className="text-xs text-purple-700 font-medium">Avg Hrs</p>
              <p className="text-lg font-bold text-purple-900">
                {stats.avgHours}
              </p>
            </div>
            <div className="text-center p-2 rounded bg-green-50">
              <p className="text-xs text-green-700 font-medium">Sessions</p>
              <p className="text-lg font-bold text-green-900">
                {stats.sessions}
              </p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-1.5 pt-2 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-700">
              Filter by Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="filter-start-date" className="sr-only">
                  Start Date
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  placeholder="Start date"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="filter-end-date" className="sr-only">
                  End Date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  placeholder="End date"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Daily Hours Chart */}
          {dailyData.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Daily Hours (Last 7 Days)
              </p>
              <div className="flex items-end justify-between gap-1 h-20">
                {dailyData.map((day) => {
                  const heightPercent = (day.hours / maxHours) * 100;
                  const dayName = new Date(day.date).toLocaleDateString(
                    "en-US",
                    { weekday: "short" }
                  );
                  const dateNum = new Date(day.date).getDate();
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full flex items-end justify-center"
                        style={{ height: "60px" }}
                      >
                        <div
                          className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500 relative group cursor-pointer"
                          style={{
                            height: `${heightPercent}%`,
                            minHeight: day.hours > 0 ? "4px" : "0",
                          }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                            {day.hours.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-medium text-gray-700 block">
                          {dayName}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {dateNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Time Logs History */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Time Logs</h2>
          <span className="text-xs text-gray-600">
            {logs.length} {logs.length === 1 ? "log" : "logs"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {fetchingLogs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No time logs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-gray-50 rounded border border-gray-200 hover:border-blue-500/50 transition-all"
                >
                  {editingId === log.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor={`edit-login-${log.id}`}
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Login
                          </label>
                          <input
                            id={`edit-login-${log.id}`}
                            type="datetime-local"
                            value={editLogin}
                            onChange={(e) => setEditLogin(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`edit-logout-${log.id}`}
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Logout
                          </label>
                          <input
                            id={`edit-logout-${log.id}`}
                            type="datetime-local"
                            value={editLogout}
                            onChange={(e) => setEditLogout(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateLog(log.id)}
                          disabled={loading}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-all disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-all"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="font-medium text-gray-600 mb-0.5">
                            Login
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {formatDisplayTime(log.loginTime)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 mb-0.5">
                            Logout
                          </p>
                          <p className="text-gray-900 font-semibold">
                            {log.logoutTime
                              ? formatDisplayTime(log.logoutTime)
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600 mb-0.5">
                            Hours
                          </p>
                          <p className="text-blue-600 font-bold">
                            {log.logoutTime
                              ? `${log.workHours.toFixed(1)}h`
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(log)}
                          disabled={loading}
                          className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-all"
                          aria-label="Edit log"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={loading}
                          className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-all"
                          aria-label="Delete log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
