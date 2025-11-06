"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { auth } from "@/lib/firebase";
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  Check,
  X,
  Save,
  Circle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTimesheetNotification,
  createErrorNotification,
} from "@/lib/notificationHelpers";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { useLoading } from "@/contexts/LoadingContext";

interface TimesheetEntry {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  description: string;
  tags: string[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DayGroup {
  date: string;
  entries: TimesheetEntry[];
  totalHours: number;
}

export default function ModernTimesheet() {
  const { moveToRecycleBin } = useRecycleBin();
  const { withLoading } = useLoading();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(7); // Show 7 days at a time
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [entryMode, setEntryMode] = useState<"hourly" | "daily">("hourly"); // New: Entry mode toggle
  const [newEntry, setNewEntry] = useState({
    startTime: "",
    endTime: "",
    description: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(
    null
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const newEntryRef = useRef<HTMLInputElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const weekPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      fetchEntries();
      loadRecentTags();
    }
  }, [currentUserId]);

  useEffect(() => {
    // Auto-save drafts to localStorage
    const drafts = entries.filter((e) => e.isDraft);
    if (drafts.length > 0) {
      localStorage.setItem("timesheet-drafts", JSON.stringify(drafts));
    }
  }, [entries]);

  useEffect(() => {
    // Focus new entry input when shown
    if (showNewEntry && newEntryRef.current) {
      newEntryRef.current.focus();
    }
  }, [showNewEntry]);

  const fetchEntries = async () => {
    if (!currentUserId) return;
    setFetchingEntries(true);

    await withLoading(async () => {
      try {
        const response = await fetch(`/api/timesheet?userId=${currentUserId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(errorData.details || "Failed to fetch entries");
        }

        const data = await response.json();
        setEntries(data.entries || []);
      } catch (error: any) {
        console.error("Error fetching entries:", error);
        await createErrorNotification(
          error.message || "Failed to load timesheet",
          "Timesheet"
        );
        setEntries([]);
      } finally {
        setFetchingEntries(false);
      }
    }, "Loading timesheet...");
  };

  const loadRecentTags = () => {
    const saved = localStorage.getItem("timesheet-recent-tags");
    if (saved) {
      setRecentTags(JSON.parse(saved));
    }
  };

  const saveRecentTags = (tags: string[]) => {
    const allTags = [...new Set([...tags, ...recentTags])].slice(0, 10);
    setRecentTags(allTags);
    localStorage.setItem("timesheet-recent-tags", JSON.stringify(allTags));
  };

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return (endMinutes - startMinutes) / 60; // Return hours
  };

  const handleAddEntry = async () => {
    if (!currentUserId || !newEntry.startTime) {
      toast.error("Please enter at least a start time");
      return;
    }

    setLoading(true);
    try {
      let duration = 0;
      let startTime = newEntry.startTime;
      let endTime = newEntry.endTime;

      // Calculate duration if end time is provided
      duration = endTime ? calculateDuration(startTime, endTime) : 0;

      const response = await fetch("/api/timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          date: selectedDate.toISOString(),
          startTime: startTime,
          endTime: endTime || null,
          duration,
          description: newEntry.description,
          tags: newEntry.tags,
          isDraft: !endTime, // Draft if no end time
        }),
      });

      if (!response.ok) throw new Error("Failed to create entry");

      await createTimesheetNotification("add", {
        date: selectedDate,
        startTime: startTime,
      });
      saveRecentTags(newEntry.tags);
      setNewEntry({ startTime: "", endTime: "", description: "", tags: [] });
      setShowNewEntry(false);
      await fetchEntries();
    } catch (error: any) {
      console.error("Error creating entry:", error);
      await createErrorNotification("Failed to add entry", "Timesheet");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (
    id: string,
    updates: Partial<TimesheetEntry>
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/timesheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) throw new Error("Failed to update entry");

      await createTimesheetNotification("update", { id, updates });
      setEditingId(null);
      await fetchEntries();
    } catch (error: any) {
      console.error("Error updating entry:", error);
      await createErrorNotification("Failed to update entry", "Timesheet");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const entryToDelete = entries.find((entry) => entry.id === id);
    if (!entryToDelete) return;

    if (!confirm("Move this entry to Recycle Bin?")) return;

    setLoading(true);
    try {
      // First delete from backend
      const response = await fetch(`/api/timesheet?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete entry");

      // Move to recycle bin
      await moveToRecycleBin("timesheet", entryToDelete, id);
      await createTimesheetNotification("delete", { id });
      await fetchEntries();
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      await createErrorNotification("Failed to delete entry", "Timesheet");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    action?: () => void
  ) => {
    if (e.key === "Enter" && action) {
      e.preventDefault();
      action();
    }
    if (e.key === "Escape") {
      setShowNewEntry(false);
      setEditingId(null);
    }
  };

  const parseTagsFromDescription = (desc: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = desc.match(tagRegex);
    return matches ? matches.map((tag) => tag.slice(1)) : [];
  };

  const handleDescriptionChange = (value: string) => {
    const detectedTags = parseTagsFromDescription(value);
    setNewEntry({ ...newEntry, description: value, tags: detectedTags });
  };

  // Smart time suggestions in 12-hour AM/PM format
  const getSmartTimeSuggestions = (): string[] => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Round to nearest 15 min
    const roundedMinute = Math.round(currentMinute / 15) * 15;
    const suggestions: string[] = [];

    // Convert to 12-hour format
    const convert24To12 = (hour: number, minute: number): string => {
      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
    };

    // Current time (rounded)
    suggestions.push(convert24To12(currentHour, roundedMinute));

    // Common work hours in 12-hour format
    const commonTimes = [
      "9:00 AM",
      "10:00 AM",
      "12:00 PM",
      "1:00 PM",
      "2:00 PM",
      "3:00 PM",
      "4:00 PM",
      "5:00 PM",
      "6:00 PM",
    ];
    commonTimes.forEach((time) => {
      if (!suggestions.includes(time)) {
        suggestions.push(time);
      }
    });

    return suggestions.slice(0, 6);
  };

  // Convert 12-hour AM/PM to 24-hour format
  const convert12To24 = (time12: string): string => {
    const [time, period] = time12.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  // Convert 24-hour to 12-hour AM/PM format
  const convert24To12 = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const handleTimeSelect = (time: string, field: "start" | "end") => {
    // Convert from 12-hour to 24-hour format for internal storage
    const time24 = convert12To24(time);

    if (field === "start") {
      setNewEntry({ ...newEntry, startTime: time24 });
      // Auto-suggest end time (1 hour later)
      if (!newEntry.endTime) {
        const [hours, mins] = time24.split(":").map(Number);
        const endHour = (hours + 1) % 24;
        setNewEntry({
          ...newEntry,
          startTime: time24,
          endTime: `${String(endHour).padStart(2, "0")}:${String(mins).padStart(
            2,
            "0"
          )}`,
        });
      }
    } else {
      setNewEntry({ ...newEntry, endTime: time24 });
    }
    setShowTimePicker(null);
  };

  // Click outside to close time picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target as Node)
      ) {
        setShowTimePicker(null);
      }
      if (
        weekPickerRef.current &&
        !weekPickerRef.current.contains(event.target as Node)
      ) {
        setShowWeekPicker(false);
      }
    };

    if (showTimePicker || showWeekPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTimePicker, showWeekPicker]);

  // Get week days starting from selected date
  const getWeekDays = (): Date[] => {
    const days: Date[] = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowWeekPicker(false);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    setSelectedDate(newDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const groupEntriesByDate = (): DayGroup[] => {
    const grouped = new Map<string, TimesheetEntry[]>();

    entries.forEach((entry) => {
      const date = new Date(entry.date).toISOString().split("T")[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(entry);
    });

    return Array.from(grouped.entries())
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        totalHours: entries.reduce((sum, e) => sum + e.duration, 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, viewDays);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  const dayGroups = groupEntriesByDate();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Quick Actions */}
      <div className="shrink-0 px-3 py-2.5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Modern Timesheet
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewEntry(!showNewEntry)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-all"
              title="Add entry (Enter)"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Entry</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-all"
              title="Export PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-all"
              title="Email Report"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Add Entry Form */}
        {showNewEntry && (
          <div className="mt-3 p-3 rounded bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200">
            {/* Date Picker & Entry Mode Toggle */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* Date Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowWeekPicker(!showWeekPicker)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:border-blue-500 transition-all"
                  type="button"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </button>

                {/* Inline Week Picker */}
                {showWeekPicker && (
                  <div
                    ref={weekPickerRef}
                    className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-xl z-50 p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => navigateWeek("prev")}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        type="button"
                        title="Previous week"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="text-sm font-semibold text-gray-900">
                        {getWeekDays()[0].toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => navigateWeek("next")}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        type="button"
                        title="Next week"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, index) => (
                          <div
                            key={day}
                            className="text-center text-xs font-semibold text-gray-600 py-1"
                          >
                            {day}
                          </div>
                        )
                      )}
                      {getWeekDays().map((day) => (
                        <button
                          key={day.toISOString()}
                          onClick={() => handleDateSelect(day)}
                          className={`p-2 text-sm rounded transition-all ${
                            isSameDay(day, selectedDate)
                              ? "bg-blue-600 text-white font-semibold"
                              : isToday(day)
                              ? "bg-blue-100 text-blue-800 font-medium"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                          type="button"
                        >
                          {day.getDate()}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                        setShowWeekPicker(false);
                      }}
                      className="w-full mt-3 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      type="button"
                    >
                      Today
                    </button>
                  </div>
                )}
              </div>

              {/* Entry Mode Toggle */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300 rounded">
                <button
                  onClick={() => setEntryMode("hourly")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    entryMode === "hourly"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  type="button"
                >
                  ⏱️ Hourly
                </button>
                <button
                  onClick={() => setEntryMode("daily")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    entryMode === "daily"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  type="button"
                >
                  📅 Daily
                </button>
              </div>
            </div>

            {/* Mode Description */}
            <div className="mb-2 px-2 py-1.5 bg-white/50 rounded">
              <span className="text-xs text-gray-600">
                {entryMode === "hourly" ? (
                  <>
                    ⏱️ <strong className="text-gray-900">Hourly Mode:</strong>{" "}
                    Track specific time ranges
                  </>
                ) : (
                  <>
                    📅 <strong className="text-gray-900">Daily Mode:</strong>{" "}
                    Log full day work (default 8 hours)
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="relative shrink-0">
                <button
                  onClick={() =>
                    setShowTimePicker(
                      showTimePicker === "start" ? null : "start"
                    )
                  }
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:border-blue-500 transition-all group"
                  type="button"
                >
                  <PlayCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                    {newEntry.startTime
                      ? convert24To12(newEntry.startTime)
                      : "--:--"}
                  </span>
                </button>

                {/* Smart Time Picker Dropdown */}
                {showTimePicker === "start" && (
                  <div
                    ref={timePickerRef}
                    className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-xl z-50 p-2"
                  >
                    <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                      Quick Select
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {getSmartTimeSuggestions().map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time, "start")}
                          className="px-2 py-1.5 text-xs rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-all"
                          type="button"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <input
                        type="time"
                        value={newEntry.startTime}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 bg-gray-50 text-gray-900"
                        title="Select start time"
                        aria-label="Select start time"
                      />
                    </div>
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-400" />

              <div className="relative shrink-0">
                <button
                  onClick={() =>
                    setShowTimePicker(showTimePicker === "end" ? null : "end")
                  }
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:border-blue-500 transition-all"
                  type="button"
                >
                  <StopCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                    {newEntry.endTime
                      ? convert24To12(newEntry.endTime)
                      : "--:--"}
                  </span>
                </button>

                {/* Smart Time Picker Dropdown */}
                {showTimePicker === "end" && (
                  <div
                    ref={timePickerRef}
                    className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-xl z-50 p-2"
                  >
                    <div className="text-xs font-semibold text-gray-600 mb-2 px-2">
                      Quick Select
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {getSmartTimeSuggestions().map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time, "end")}
                          className="px-2 py-1.5 text-xs rounded hover:bg-blue-100 text-gray-700 hover:text-blue-600 transition-all"
                          type="button"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <input
                        type="time"
                        value={newEntry.endTime}
                        onChange={(e) =>
                          setNewEntry({ ...newEntry, endTime: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 bg-gray-50 text-gray-900"
                        title="Select end time"
                        aria-label="Select end time"
                      />
                    </div>
                  </div>
                )}
              </div>

              {newEntry.startTime && newEntry.endTime && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  {calculateDuration(
                    newEntry.startTime,
                    newEntry.endTime
                  ).toFixed(1)}
                  h
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newEntry.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        handleAddEntry();
                      } else if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const textarea = e.currentTarget;
                        const cursorPos = textarea.selectionStart;
                        const textBefore = newEntry.description.substring(
                          0,
                          cursorPos
                        );
                        const textAfter =
                          newEntry.description.substring(cursorPos);
                        const newText = textBefore + "\n• " + textAfter;
                        setNewEntry({ ...newEntry, description: newText });
                        setTimeout(() => {
                          if (textarea) {
                            textarea.selectionStart = cursorPos + 3;
                            textarea.selectionEnd = cursorPos + 3;
                            textarea.focus();
                          }
                        }, 0);
                      }
                    }}
                    onFocus={(e) => {
                      // Add bullet to first line if textarea is empty
                      if (newEntry.description.trim() === "") {
                        setNewEntry({ ...newEntry, description: "• " });
                        setTimeout(() => {
                          e.target.selectionStart = 2;
                          e.target.selectionEnd = 2;
                        }, 0);
                      }
                    }}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 resize-none"
                    placeholder="What did you work on? (use #tags for projects)&#10;• Press Enter to add bullet points&#10;• Press Ctrl+Enter to save"
                  />
                </div>
                <button
                  onClick={handleAddEntry}
                  disabled={
                    loading ||
                    !newEntry.startTime ||
                    !newEntry.description.trim()
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all self-start"
                  title="Save entry (Ctrl+Enter)"
                  aria-label="Save entry"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {newEntry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {newEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Scrolling Timeline */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scroll Navigation Buttons */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
          aria-label="Scroll left"
          title="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
          aria-label="Scroll right"
          title="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        {/* Horizontal Day Groups Container */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin scroll-smooth"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="flex gap-4 p-4 h-full min-w-min">
            {fetchingEntries ? (
              <div className="flex items-center justify-center w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : dayGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full text-center">
                <Calendar className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">
                  No entries yet. Click "Add Entry" to get started!
                </p>
              </div>
            ) : (
              dayGroups.map((dayGroup) => (
                <div
                  key={dayGroup.date}
                  className="shrink-0 w-96 h-full flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Day Header */}
                  <div className="shrink-0 p-2.5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {new Date(dayGroup.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {dayGroup.entries.length} entries
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-sm font-bold text-blue-600">
                          {dayGroup.totalHours.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Entries List - Scrollable vertically within day */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin">
                    {dayGroup.entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="relative pl-5 pr-2.5 py-2.5 rounded bg-linear-to-r from-gray-50 to-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                      >
                        {/* Bullet Point */}
                        <div className="absolute left-2 top-3.5 flex flex-col items-center">
                          <Circle className="w-2 h-2 fill-blue-600 text-blue-600" />
                          {index < dayGroup.entries.length - 1 && (
                            <div className="w-0.5 h-full bg-linear-to-b from-blue-300 to-transparent mt-1"></div>
                          )}
                        </div>{" "}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded">
                              <PlayCircle className="w-3 h-3" />
                              {convert24To12(entry.startTime)}
                            </div>
                            {entry.endTime && (
                              <>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded">
                                  <StopCircle className="w-3 h-3" />
                                  {convert24To12(entry.endTime)}
                                </div>
                              </>
                            )}
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                              <Clock className="w-3 h-3" />
                              {entry.duration.toFixed(1)}h
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingId(entry.id)}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-700 mb-1.5 leading-relaxed">
                            {entry.description}
                          </p>
                        )}
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {entry.isDraft && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            <Clock className="w-3 h-3 animate-pulse" />
                            In Progress
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
