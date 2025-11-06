"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { auth } from "@/lib/firebase";
import {
  Clock,
  Plus,
  Download,
  Mail,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  PlayCircle,
  StopCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTimesheetNotification,
  createErrorNotification,
} from "@/lib/notificationHelpers";
import { useRecycleBin } from "@/contexts/RecycleBinContext";

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

export default function ModernTimesheetMobile() {
  const { moveToRecycleBin } = useRecycleBin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEntries, setFetchingEntries] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekViewDate, setWeekViewDate] = useState(new Date());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [entryMode, setEntryMode] = useState<"hourly" | "daily">("hourly");
  const [newEntry, setNewEntry] = useState({
    startTime: "",
    endTime: "",
    description: "",
    tags: [] as string[],
  });
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<"start" | "end" | null>(
    null
  );
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
    }
  }, [currentUserId]);

  useEffect(() => {
    if (showNewEntry && newEntryRef.current) {
      newEntryRef.current.focus();
    }
  }, [showNewEntry]);

  const fetchEntries = async () => {
    if (!currentUserId) return;
    setFetchingEntries(true);
    try {
      const response = await fetch(`/api/timesheet?userId=${currentUserId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
  };

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return (endMinutes - startMinutes) / 60;
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
          isDraft: !endTime,
        }),
      });

      if (!response.ok) throw new Error("Failed to create entry");

      await createTimesheetNotification("add", {
        date: selectedDate,
        startTime: startTime,
      });
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

  const handleDeleteEntry = async (id: string) => {
    const entryToDelete = entries.find((entry) => entry.id === id);
    if (!entryToDelete) return;

    if (!confirm("Move this entry to Recycle Bin?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/timesheet?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete entry");

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

    const roundedMinute = Math.round(currentMinute / 15) * 15;
    const suggestions: string[] = [];

    // Convert to 12-hour format
    const convert24To12 = (hour: number, minute: number): string => {
      const period = hour >= 12 ? "PM" : "AM";
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
    };

    suggestions.push(convert24To12(currentHour, roundedMinute));

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
  const convert24To12Display = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const handleTimeSelect = (time: string, field: "start" | "end") => {
    const time24 = convert12To24(time);

    if (field === "start") {
      setNewEntry({ ...newEntry, startTime: time24 });
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

  // Week picker helper functions
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const startOfWeek = new Date(weekViewDate);
    startOfWeek.setDate(weekViewDate.getDate() - weekViewDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

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
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const dayGroups = groupEntriesByDate();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile Header */}
      <div className="shrink-0 p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Timesheet
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowWeekPicker(!showWeekPicker)}
                className="p-2 bg-white border border-gray-300 rounded-md hover:border-blue-500 transition-all"
                type="button"
                title="Select date"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
              </button>

              {/* Week Picker Dropdown */}
              {showWeekPicker && (
                <div
                  ref={weekPickerRef}
                  className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => navigateWeek("prev")}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
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
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      type="button"
                      title="Next week"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <div
                        key={`${day}-${index}`}
                        className="text-center text-xs font-semibold text-gray-600 py-1"
                      >
                        {day}
                      </div>
                    ))}
                    {getWeekDays().map((day) => (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDateSelect(day)}
                        className={`p-2 text-sm rounded-md transition-all ${
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
                    className="w-full mt-3 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    type="button"
                  >
                    Today
                  </button>
                </div>
              )}
            </div>

            <button
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              title="Export PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
              title="Email Report"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>

        {/* Quick Add Entry Form */}
        {showNewEntry && (
          <div className="mt-3 p-3 rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
            {/* Entry Mode Toggle */}
            <div className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg">
              <button
                onClick={() => setEntryMode("hourly")}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
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
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  entryMode === "daily"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                type="button"
              >
                📅 Daily
              </button>
            </div>{" "}
            {/* Mode Description */}
            <div className="px-2 py-1.5 bg-white/50 rounded-md">
              <span className="text-xs text-gray-600">
                {entryMode === "hourly" ? (
                  <>
                    ⏱️{" "}
                    <strong className="text-gray-900">
                      Hourly:
                    </strong>{" "}
                    Track specific times
                  </>
                ) : (
                  <>
                    📅{" "}
                    <strong className="text-gray-900">
                      Daily:
                    </strong>{" "}
                    Log full day (8hrs default)
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <button
                  onClick={() =>
                    setShowTimePicker(
                      showTimePicker === "start" ? null : "start"
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-all"
                  type="button"
                >
                  <PlayCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {newEntry.startTime
                      ? convert24To12Display(newEntry.startTime)
                      : "Start"}
                  </span>
                </button>

                {showTimePicker === "start" && (
                  <div
                    ref={timePickerRef}
                    className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2"
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
                        title="Start time"
                        aria-label="Start time"
                      />
                    </div>
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-400" />

              <div className="relative flex-1">
                <button
                  onClick={() =>
                    setShowTimePicker(showTimePicker === "end" ? null : "end")
                  }
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-all"
                  type="button"
                >
                  <StopCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {newEntry.endTime
                      ? convert24To12Display(newEntry.endTime)
                      : "End"}
                  </span>
                </button>

                {showTimePicker === "end" && (
                  <div
                    ref={timePickerRef}
                    className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2"
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
                        title="End time"
                        aria-label="End time"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {newEntry.startTime && newEntry.endTime && (
              <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                <Clock className="w-3 h-3" />
                {calculateDuration(
                  newEntry.startTime,
                  newEntry.endTime
                ).toFixed(1)}
                h
              </div>
            )}
            {/* Date Picker with Week View */}
            <div className="relative">
              <button
                onClick={() => setShowWeekPicker(!showWeekPicker)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-all"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>

              {showWeekPicker && (
                <div
                  ref={weekPickerRef}
                  className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        const newDate = new Date(weekViewDate);
                        newDate.setDate(newDate.getDate() - 7);
                        setWeekViewDate(newDate);
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      type="button"
                      aria-label="Previous week"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="text-xs font-semibold text-gray-700">
                      {weekViewDate.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => {
                        const newDate = new Date(weekViewDate);
                        newDate.setDate(newDate.getDate() + 7);
                        setWeekViewDate(newDate);
                      }}
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                      type="button"
                      aria-label="Next week"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                      <div
                        key={idx}
                        className="text-center text-xs font-medium text-gray-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getWeekDates().map((date, idx) => {
                      const isSelected = isSameDay(date, selectedDate);
                      const isToday = isSameDay(date, new Date());
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedDate(date);
                            setShowWeekPicker(false);
                          }}
                          className={`p-2 text-xs font-medium rounded transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : isToday
                              ? "bg-blue-100 text-blue-600"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                          type="button"
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDate(new Date());
                      setWeekViewDate(new Date());
                      setShowWeekPicker(false);
                    }}
                    className="w-full mt-2 px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    type="button"
                  >
                    Today
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newEntry.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const textarea = e.currentTarget;
                    const cursorPos = textarea.selectionStart;
                    const textBefore = newEntry.description.substring(
                      0,
                      cursorPos
                    );
                    const textAfter = newEntry.description.substring(cursorPos);
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 resize-none"
                placeholder="What did you work on? (use #tags)&#10;Press Enter to add bullet points"
              />
            </div>
            {newEntry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {newEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={handleAddEntry}
              disabled={
                loading || !newEntry.startTime || !newEntry.description.trim()
              }
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Entry
            </button>
          </div>
        )}
      </div>

      {/* Vertical Scrolling Day List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {fetchingEntries ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : dayGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">
              No entries yet. Click "Add Entry" to get started!
            </p>
          </div>
        ) : (
          dayGroups.map((dayGroup) => (
            <div
              key={dayGroup.date}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Day Header - Collapsible */}
              <button
                onClick={() => toggleDay(dayGroup.date)}
                className="w-full p-3 bg-gray-50 flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {new Date(dayGroup.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {dayGroup.entries.length} entries ·{" "}
                    {dayGroup.totalHours.toFixed(1)}h
                  </p>
                </div>
                {expandedDays.has(dayGroup.date) ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Day Entries */}
              {expandedDays.has(dayGroup.date) && (
                <div className="p-3 space-y-2.5 border-t border-gray-200">
                  {dayGroup.entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="relative pl-6 pr-3 py-3 rounded-lg bg-linear-to-r from-gray-50 to-white border border-gray-200"
                    >
                      {/* Bullet Point */}
                      <div className="absolute left-2 top-4 flex flex-col items-center">
                        <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                        {index < dayGroup.entries.length - 1 && (
                          <div className="w-0.5 h-full bg-linear-to-b from-blue-300 to-transparent mt-1"></div>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md">
                            <PlayCircle className="w-3 h-3" />
                            {convert24To12Display(entry.startTime)}
                          </div>
                          {entry.endTime && (
                            <>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-md">
                                <StopCircle className="w-3 h-3" />
                                {convert24To12Display(entry.endTime)}
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                            <Clock className="w-3 h-3" />
                            {entry.duration.toFixed(1)}h
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                          {entry.description}
                        </p>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full flex items-center gap-1 shadow-sm"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.isDraft && (
                        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3 animate-pulse" />
                          In Progress
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
