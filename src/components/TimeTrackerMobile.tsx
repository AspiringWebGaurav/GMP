"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  Clock,
  LogIn,
  LogOut,
  Edit2,
  Trash2,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useRecycleBin } from "@/contexts/RecycleBinContext";

interface TimeLog {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime: string | null;
  workHours: number;
  createdAt: string;
}

export default function TimeTrackerMobile() {
  const { moveToRecycleBin } = useRecycleBin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [manualLoginTime, setManualLoginTime] = useState("");
  const [manualLogoutTime, setManualLogoutTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLogin, setEditLogin] = useState("");
  const [editLogout, setEditLogout] = useState("");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

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
    if (!auth.currentUser) return;

    setFetchingLogs(true);
    try {
      const response = await fetch(
        `/api/time-logs?userId=${auth.currentUser.uid}`
      );

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
      toast.error(error.message || "Failed to fetch time logs");
      setLogs([]);
    } finally {
      setFetchingLogs(false);
    }
  };

  const handlePunchIn = () => {
    const now = new Date().toISOString().slice(0, 16);
    setManualLoginTime(now);
    toast.success("Punched in");
  };

  const handlePunchOut = () => {
    const now = new Date().toISOString().slice(0, 16);
    setManualLogoutTime(now);
    toast.success("Punched out");
  };

  const handleSubmitLog = async () => {
    if (!auth.currentUser) {
      toast.error("You must be logged in");
      return;
    }

    if (!manualLoginTime) {
      toast.error("Login time is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/time-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          loginTime: new Date(manualLoginTime).toISOString(),
          logoutTime: manualLogoutTime
            ? new Date(manualLogoutTime).toISOString()
            : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create log");

      toast.success("Time log saved");
      setManualLoginTime("");
      setManualLogoutTime("");
      await fetchLogs();
    } catch (error) {
      console.error("Error saving log:", error);
      toast.error("Failed to save time log");
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
      const response = await fetch(`/api/time-logs?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete log");

      await moveToRecycleBin("time-tracker", logToDelete, id);
      await fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete time log");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (log: TimeLog) => {
    setEditingId(log.id);
    setEditLogin(new Date(log.loginTime).toISOString().slice(0, 16));
    setEditLogout(
      log.logoutTime ? new Date(log.logoutTime).toISOString().slice(0, 16) : ""
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLogin("");
    setEditLogout("");
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

      toast.success("Time log updated");
      cancelEdit();
      await fetchLogs();
    } catch (error) {
      console.error("Error updating log:", error);
      toast.error("Failed to update time log");
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
      totalHours: totalHours.toFixed(2),
      avgHours: avgHours.toFixed(2),
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 p-2.5 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-gray-900">
          <Clock className="w-4 h-4 text-blue-600" />
          Time Tracker
        </h2>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* Punch In/Out */}
        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-3.5 h-3.5 text-green-600" />
            <h3 className="text-xs font-semibold text-gray-900">
              Punch In
            </h3>
          </div>
          <label htmlFor="mobile-login-time" className="sr-only">
            Login Time
          </label>
          <input
            id="mobile-login-time"
            type="datetime-local"
            value={manualLoginTime}
            onChange={(e) => setManualLoginTime(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 mb-2"
          />
          <button
            onClick={handlePunchIn}
            disabled={loading}
            className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            Auto Punch In
          </button>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <h3 className="text-xs font-semibold text-gray-900">
              Punch Out
            </h3>
          </div>
          <label htmlFor="mobile-logout-time" className="sr-only">
            Logout Time
          </label>
          <input
            id="mobile-logout-time"
            type="datetime-local"
            value={manualLogoutTime}
            onChange={(e) => setManualLogoutTime(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900 mb-2"
          />
          <button
            onClick={handlePunchOut}
            disabled={loading}
            className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Auto Punch Out
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitLog}
          disabled={loading || !manualLoginTime}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Time Log"}
        </button>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <p className="text-[10px] font-medium text-blue-900 mb-0.5">
              Total
            </p>
            <p className="text-sm font-bold text-blue-900">
              {stats.totalHours}h
            </p>
          </div>
          <div className="bg-purple-50 p-2 rounded border border-purple-200">
            <p className="text-[10px] font-medium text-purple-900 mb-0.5">
              Avg
            </p>
            <p className="text-sm font-bold text-purple-900">
              {stats.avgHours}h
            </p>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <p className="text-[10px] font-medium text-green-900 mb-0.5">
              Sessions
            </p>
            <p className="text-sm font-bold text-green-900">
              {stats.sessions}
            </p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Date Range
          </h3>
          <div className="space-y-2">
            <label htmlFor="mobile-filter-start-date" className="sr-only">
              Start Date
            </label>
            <input
              id="mobile-filter-start-date"
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              placeholder="Start date"
              className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900"
            />
            <label htmlFor="mobile-filter-end-date" className="sr-only">
              End Date
            </label>
            <input
              id="mobile-filter-end-date"
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              placeholder="End date"
              className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Daily Hours Chart - Below Date Filter */}
        {dailyData.length > 0 && (
          <div className="bg-white p-2.5 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Daily Hours (Last 7 Days)
            </p>
            <div className="flex items-end justify-between gap-1 h-20">
              {dailyData.map((day) => {
                const heightPercent = (day.hours / maxHours) * 100;
                const dayName = new Date(day.date).toLocaleDateString("en-US", {
                  weekday: "short",
                });
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
                          minHeight: day.hours > 0 ? "6px" : "0",
                        }}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
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

        {/* Time Logs */}
        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Recent Logs
          </h3>

          {fetchingLogs ? (
            <div className="text-center py-6 text-xs text-gray-600">
              Loading...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-600">
              No logs found
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 bg-gray-50 rounded border border-gray-200"
                >
                  {editingId === log.id ? (
                    <div className="space-y-2">
                      <label
                        htmlFor={`mobile-edit-login-${log.id}`}
                        className="sr-only"
                      >
                        Edit Login Time
                      </label>
                      <input
                        id={`mobile-edit-login-${log.id}`}
                        type="datetime-local"
                        value={editLogin}
                        onChange={(e) => setEditLogin(e.target.value)}
                        placeholder="Login time"
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-900"
                      />
                      <label
                        htmlFor={`mobile-edit-logout-${log.id}`}
                        className="sr-only"
                      >
                        Edit Logout Time
                      </label>
                      <input
                        id={`mobile-edit-logout-${log.id}`}
                        type="datetime-local"
                        value={editLogout}
                        onChange={(e) => setEditLogout(e.target.value)}
                        placeholder="Logout time"
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-900"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateLog(log.id)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1 mb-2">
                        <div>
                          <p className="text-[10px] font-medium text-gray-600">
                            Login
                          </p>
                          <p className="text-xs font-semibold text-gray-900">
                            {formatDisplayTime(log.loginTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-600">
                            Logout
                          </p>
                          <p className="text-xs font-semibold text-gray-900">
                            {log.logoutTime
                              ? formatDisplayTime(log.logoutTime)
                              : "Not logged out"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-600">
                            Duration
                          </p>
                          <p className="text-xs font-semibold text-blue-600">
                            {log.logoutTime
                              ? `${log.workHours.toFixed(2)} hours`
                              : "In progress"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(log)}
                          disabled={loading}
                          className="flex-1 p-1.5 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={loading}
                          className="flex-1 p-1.5 bg-red-100 text-red-700 rounded text-xs flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </>
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
