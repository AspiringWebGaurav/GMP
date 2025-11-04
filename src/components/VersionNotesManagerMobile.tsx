"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  Plus,
  History,
  ChevronLeft,
  ChevronRight,
  Save,
  Sparkles,
  Zap,
  X,
  Eye,
} from "lucide-react";

interface VersionHistory {
  id: string;
  version: string;
  changelog: string[];
  createdAt: Date;
}

export default function VersionNotesManagerMobile() {
  const [version, setVersion] = useState("");
  const [customVersion, setCustomVersion] = useState("");
  const [isCustomVersion, setIsCustomVersion] = useState(false);
  const [changelogInput, setChangelogInput] = useState("");
  const [changelog, setChangelog] = useState<string[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeView, setActiveView] = useState<"form" | "history">("form");

  // Version shortcuts for quick selection
  const versionShortcuts = [
    { label: "Patch", prefix: "0.0.", description: "Bug fixes", icon: "🔧" },
    { label: "Minor", prefix: "0.", description: "New features", icon: "✨" },
    { label: "Major", prefix: "", description: "Breaking changes", icon: "🚀" },
  ];

  // Common changelog suggestions
  const changelogSuggestions = [
    "Added new feature",
    "Fixed bug in",
    "Improved performance",
    "Updated UI/UX",
    "Enhanced security",
    "Optimized code",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const historyQuery = query(
        collection(db, "versionHistory"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as VersionHistory[];

      setHistory(historyData);

      if (historyData.length > 0) {
        const latest = historyData[0];
        const versionParts = latest.version.replace("v", "").split(".");
        const patch = parseInt(versionParts[2] || "0") + 1;
        setVersion(`v${versionParts[0]}.${versionParts[1]}.${patch}`);
      } else {
        setVersion("v0.1.0");
      }
    } catch (error) {
      console.error("Error loading version data:", error);
      toast.error("Failed to load version data");
    } finally {
      setLoading(false);
    }
  };

  const addChangelogItem = (item: string) => {
    if (item.trim() && !changelog.includes(item.trim())) {
      setChangelog([...changelog, item.trim()]);
      setChangelogInput("");
    }
  };

  const handleChangelogKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && changelogInput.trim()) {
      addChangelogItem(changelogInput);
    }
  };

  const removeChangelogItem = (index: number) => {
    setChangelog(changelog.filter((_, i) => i !== index));
  };

  const getVersionToSave = () => {
    return isCustomVersion && customVersion.trim()
      ? customVersion.trim()
      : version;
  };

  const saveVersion = async () => {
    const versionToSave = getVersionToSave();
    if (!versionToSave.trim()) {
      toast.error("Please enter a version number");
      return;
    }

    if (changelog.length === 0) {
      toast.error("Please add at least one changelog item");
      return;
    }

    setSaving(true);
    try {
      const versionData = {
        version: versionToSave,
        changelog: changelog,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "versionHistory"), versionData);

      const appSettingsRef = doc(db, "appSettings", "version");
      await setDoc(appSettingsRef, { currentVersion: versionToSave });

      const response = await fetch("/api/update-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: versionToSave }),
      });

      if (!response.ok) throw new Error("Failed to update package.json");

      toast.success(`Version ${versionToSave} saved successfully!`);
      setChangelog([]);
      await loadData();
    } catch (error) {
      console.error("Error saving version:", error);
      toast.error("Failed to save version");
    } finally {
      setSaving(false);
    }
  };

  const loadFromHistory = (item: VersionHistory) => {
    setVersion(item.version);
    setChangelog(item.changelog);
    setIsCustomVersion(false);
    setActiveView("form");
    toast.success(`Loaded version ${item.version}`);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(history.length / 5) - 1;
    if (currentPage < maxPage) setCurrentPage(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const historyPerPage = 5;
  const currentHistoryItems = history.slice(
    currentPage * historyPerPage,
    (currentPage + 1) * historyPerPage
  );

  return (
    <div className="h-full flex flex-col">
      {/* Mobile Tab Switcher */}
      <div className="flex gap-2 mb-4 p-1 light:bg-gray-100 dark:bg-white/5 rounded-lg shrink-0">
        <button
          onClick={() => setActiveView("form")}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeView === "form"
              ? "bg-blue-600 text-white shadow-md"
              : "light:text-gray-700 dark:text-gray-300"
          }`}
        >
          <Zap className="w-4 h-4" />
          Create Version
        </button>
        <button
          onClick={() => setActiveView("history")}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeView === "history"
              ? "bg-blue-600 text-white shadow-md"
              : "light:text-gray-700 dark:text-gray-300"
          }`}
        >
          <History className="w-4 h-4" />
          History ({history.length})
        </button>
      </div>

      {/* Form View */}
      {activeView === "form" && (
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Version Number */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold light:text-gray-900 dark:text-gray-200">
              Version Number
            </label>

            {!isCustomVersion ? (
              <select
                value={version}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomVersion(true);
                    setCustomVersion("");
                  } else {
                    setVersion(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 text-base rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Version selector"
              >
                <option value="">Select or create version...</option>
                {history.slice(0, 10).map((item) => (
                  <option key={item.id} value={item.version}>
                    {item.version} (existing)
                  </option>
                ))}
                <option value="custom">✏️ Type Custom Version...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customVersion}
                  onChange={(e) => setCustomVersion(e.target.value)}
                  placeholder="e.g., v1.2.0"
                  className="flex-1 px-4 py-3 text-base rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsCustomVersion(false);
                    setCustomVersion("");
                  }}
                  className="px-4 py-3 rounded-lg light:bg-gray-100 dark:bg-white/5 light:text-gray-700 dark:text-gray-300 light:hover:bg-gray-200 dark:hover:bg-white/10"
                  aria-label="Cancel custom version"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Version Increment Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {versionShortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => {
                    setIsCustomVersion(false);
                    const latest =
                      history[0]?.version.replace("v", "") || "0.0.0";
                    const parts = latest.split(".");
                    if (shortcut.label === "Patch") {
                      setVersion(
                        `v${parts[0]}.${parts[1]}.${parseInt(parts[2]) + 1}`
                      );
                    } else if (shortcut.label === "Minor") {
                      setVersion(`v${parts[0]}.${parseInt(parts[1]) + 1}.0`);
                    } else {
                      setVersion(`v${parseInt(parts[0]) + 1}.0.0`);
                    }
                  }}
                  className="px-3 py-2.5 text-sm rounded-lg light:bg-blue-50 dark:bg-blue-600/10 light:text-blue-700 dark:text-blue-400 light:hover:bg-blue-100 dark:hover:bg-blue-600/20 font-semibold border light:border-blue-200 dark:border-blue-500/30"
                >
                  <span className="mr-1">{shortcut.icon}</span>
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* Changelog Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold light:text-gray-900 dark:text-gray-200">
              Add Changelog Items
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={changelogInput}
                onChange={(e) => setChangelogInput(e.target.value)}
                onKeyPress={handleChangelogKeyPress}
                placeholder="Type and press Enter..."
                className="flex-1 px-4 py-3 text-base rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() =>
                  changelogInput.trim() && addChangelogItem(changelogInput)
                }
                disabled={!changelogInput.trim()}
                className="px-4 py-3 rounded-lg light:bg-blue-50 dark:bg-blue-600/10 light:text-blue-700 dark:text-blue-400 light:hover:bg-blue-100 dark:hover:bg-blue-600/20 disabled:opacity-50 font-semibold"
                aria-label="Add changelog item"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <p className="text-xs light:text-gray-600 dark:text-gray-400">
                Quick shortcuts:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {changelogSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => addChangelogItem(suggestion)}
                    className="px-3 py-2 text-xs rounded-lg light:bg-gray-100 dark:bg-white/5 light:text-gray-700 dark:text-gray-300 light:hover:bg-gray-200 dark:hover:bg-white/10 text-left"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Changelog */}
            {changelog.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-semibold light:text-gray-900 dark:text-gray-200">
                  Added ({changelog.length}):
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {changelog.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg light:bg-green-50 dark:bg-green-600/10 border light:border-green-200 dark:border-green-500/20"
                    >
                      <span className="light:text-green-700 dark:text-green-300 flex-1 text-sm">
                        • {item}
                      </span>
                      <button
                        onClick={() => removeChangelogItem(index)}
                        className="text-red-500 hover:text-red-600 shrink-0"
                        aria-label="Remove changelog item"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save Button - Sticky at bottom */}
          <button
            onClick={saveVersion}
            disabled={saving}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-base shadow-lg sticky bottom-0"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save & Sync to Server
              </>
            )}
          </button>
        </div>
      )}

      {/* History View */}
      {activeView === "history" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* History Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-base font-bold light:text-gray-900 dark:text-white">
              Version History
            </h3>
            {history.length > historyPerPage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded light:hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm light:text-gray-600 dark:text-gray-400 font-medium">
                  {currentPage + 1}/{Math.ceil(history.length / historyPerPage)}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={
                    currentPage >=
                    Math.ceil(history.length / historyPerPage) - 1
                  }
                  className="p-2 rounded light:hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Scrollable History */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {history.length === 0 ? (
              <div className="text-center py-12 light:bg-gray-50 dark:bg-white/5 rounded-lg">
                <Sparkles className="w-12 h-12 mx-auto mb-3 light:text-gray-400 dark:text-gray-600" />
                <p className="text-sm font-medium light:text-gray-500 dark:text-gray-400">
                  No version history yet
                </p>
              </div>
            ) : (
              currentHistoryItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-4 rounded-lg light:bg-white dark:bg-white/5 light:hover:bg-blue-50 dark:hover:bg-blue-600/10 border light:border-gray-200 dark:border-white/5 light:hover:border-blue-300 dark:hover:border-blue-500/30 shadow-sm active:scale-98 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold light:text-blue-600 dark:text-blue-400">
                      {item.version}
                    </span>
                    <span className="text-xs light:text-gray-500 dark:text-gray-500">
                      {item.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.changelog.map((change, idx) => (
                      <p
                        key={idx}
                        className="text-sm light:text-gray-700 dark:text-gray-300"
                      >
                        • {change}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t light:border-gray-200 dark:border-white/5">
                    <p className="text-xs light:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Tap to load this version
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
