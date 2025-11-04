"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

interface VersionHistory {
  id: string;
  version: string;
  changelog: string[];
  createdAt: Date;
}

export default function VersionNotesManager() {
  const [version, setVersion] = useState("");
  const [customVersion, setCustomVersion] = useState("");
  const [isCustomVersion, setIsCustomVersion] = useState(false);
  const [changelogInput, setChangelogInput] = useState("");
  const [changelog, setChangelog] = useState<string[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [historyHeight, setHistoryHeight] = useState("500px");

  const leftColumnRef = useRef<HTMLDivElement>(null);
  const leftTitleRef = useRef<HTMLDivElement>(null);
  const historyHeaderRef = useRef<HTMLDivElement>(null);

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
    "Added documentation",
    "Fixed responsive design",
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Match history height to left column
  useEffect(() => {
    const updateHistoryHeight = () => {
      if (
        leftColumnRef.current &&
        leftTitleRef.current &&
        historyHeaderRef.current
      ) {
        const leftHeight = leftColumnRef.current.offsetHeight;
        const leftTitleHeight = leftTitleRef.current.offsetHeight;
        const historyHeaderHeight = historyHeaderRef.current.offsetHeight;
        const spacing = 12; // space-y-3 gap (0.75rem = 12px)

        // Calculate: (left column height - left title height) - spacing
        // This gives us the height from after the left title to the bottom of save button
        // Then we use this same height for the history scrollable area
        const calculatedHeight = leftHeight - leftTitleHeight - spacing;
        setHistoryHeight(`${calculatedHeight}px`);
      }
    };

    // Initial update with delay to ensure DOM is ready
    const initialTimer = setTimeout(updateHistoryHeight, 200);

    // Update on window resize
    window.addEventListener("resize", updateHistoryHeight);

    // Create a MutationObserver to watch for changes in left column
    const observer = new MutationObserver(() => {
      updateHistoryHeight();
    });

    if (leftColumnRef.current) {
      observer.observe(leftColumnRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    return () => {
      window.removeEventListener("resize", updateHistoryHeight);
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [changelog, version, history]);
  const loadData = async () => {
    try {
      // Load version history from Firestore
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

      // Auto-populate from latest version if exists
      if (historyData.length > 0) {
        const latest = historyData[0];
        // Suggest next version based on latest
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
      setChangelogInput(""); // Clear input after adding
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

      // Save to version history
      await addDoc(collection(db, "versionHistory"), versionData);

      // Update current version in appSettings
      await setDoc(doc(db, "appSettings", "version"), {
        version: versionToSave,
        changelog: changelog,
        updatedAt: Timestamp.now(),
      });

      // Update package.json via API
      const response = await fetch("/api/update-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: versionToSave }),
      });

      if (response.ok) {
        toast.success("Version saved successfully! Refresh to see changes.");
        // Reload data
        await loadData();
        setChangelog([]);
        setChangelogInput("");
        setCustomVersion("");
        setIsCustomVersion(false);
      } else {
        toast.warning(
          "Version saved to database, but package.json update failed"
        );
      }
    } catch (error) {
      console.error("Error saving version:", error);
      toast.error("Failed to save version");
    } finally {
      setSaving(false);
    }
  };

  const loadFromHistory = (historyItem: VersionHistory) => {
    setVersion(historyItem.version);
    setChangelog(historyItem.changelog);
    toast.success("Loaded from history");
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(history.length / 5) - 1) {
      setCurrentPage(currentPage + 1);
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
      {/* Left Column - Main Form (50%) */}
      <div className="flex flex-col min-h-0">
        <div
          ref={leftColumnRef}
          className="space-y-3 flex flex-col overflow-y-auto pr-2 scrollbar-thin"
        >
          <div ref={leftTitleRef} className="shrink-0">
            <h2 className="text-lg font-bold light:text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Version Notes Manager
            </h2>
            <p className="light:text-gray-600 dark:text-gray-400 text-xs">
              Zero-effort versioning with smart shortcuts
            </p>
          </div>

          {/* Version Selector with Dropdown and Custom Input */}
          <div className="space-y-2 shrink-0">
            <label className="block text-xs font-semibold light:text-gray-700 dark:text-gray-300">
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
                className="w-full px-3 py-2 text-sm rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-3 py-2 text-sm rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsCustomVersion(false);
                    setCustomVersion("");
                  }}
                  className="px-3 py-2 text-xs rounded-md light:bg-gray-100 dark:bg-white/5 light:text-gray-700 dark:text-gray-300 light:hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  title="Back to dropdown"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Version Increment Buttons - Full width grid */}
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
                  className="px-3 py-2 text-xs rounded-md light:bg-blue-50 dark:bg-blue-600/10 light:text-blue-700 dark:text-blue-400 light:hover:bg-blue-100 dark:hover:bg-blue-600/20 transition-colors font-semibold border light:border-blue-200 dark:border-blue-500/30"
                  title={shortcut.description}
                >
                  <span className="mr-1">{shortcut.icon}</span>
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* Changelog Input - Free text + Suggestions */}
          <div className="space-y-2 shrink-0">
            <label className="block text-xs font-semibold light:text-gray-700 dark:text-gray-300">
              Add Changelog Items
            </label>

            {/* Free text input for changelog */}
            <div className="flex gap-2">
              <input
                type="text"
                value={changelogInput}
                onChange={(e) => setChangelogInput(e.target.value)}
                onKeyPress={handleChangelogKeyPress}
                placeholder="Type changelog item and press Enter..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() =>
                  changelogInput.trim() && addChangelogItem(changelogInput)
                }
                disabled={!changelogInput.trim()}
                className="px-3 py-2 text-xs rounded-md light:bg-blue-50 dark:bg-blue-600/10 light:text-blue-700 dark:text-blue-400 light:hover:bg-blue-100 dark:hover:bg-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            {/* Quick suggestions - Optional shortcuts */}
            <div className="space-y-1">
              <p className="text-[10px] light:text-gray-500 dark:text-gray-400">
                Or use quick shortcuts:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {changelogSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => addChangelogItem(suggestion)}
                    className="px-2 py-1.5 text-xs rounded-md light:bg-gray-100 dark:bg-white/5 light:text-gray-700 dark:text-gray-300 light:hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1 truncate"
                    title={`Click to add: ${suggestion}`}
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Changelog Items - Fixed max-height scrollable */}
            {changelog.length > 0 && (
              <div className="max-h-32 overflow-y-auto pr-1 scrollbar-thin space-y-1.5 light:bg-gray-50/50 dark:bg-white/5 rounded-lg p-2 mt-2">
                {changelog.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-md light:bg-green-50 dark:bg-green-600/10 group text-xs border light:border-green-200 dark:border-green-500/20"
                  >
                    <span className="light:text-green-700 dark:text-green-300 flex-1 wrap-break-word">
                      • {item}
                    </span>
                    <button
                      onClick={() => removeChangelogItem(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity shrink-0"
                      aria-label="Remove"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={saveVersion}
            disabled={saving}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm shrink-0 shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Sync to Server
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column - Version History (50%) - Fully Scrollable */}
      <div className="flex flex-col min-h-0">
        <div className="space-y-3 flex flex-col overflow-y-auto pr-2 scrollbar-thin">
          <div
            ref={historyHeaderRef}
            className="flex items-center justify-between shrink-0"
          >
            <h3 className="text-sm font-bold light:text-gray-900 dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4" />
              Version History
            </h3>
            {history.length > historyPerPage && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-1 rounded light:hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 light:text-gray-700 dark:text-gray-400"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs light:text-gray-600 dark:text-gray-400 font-medium">
                  {currentPage + 1}/{Math.ceil(history.length / historyPerPage)}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={
                    currentPage >=
                    Math.ceil(history.length / historyPerPage) - 1
                  }
                  className="p-1 rounded light:hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 light:text-gray-700 dark:text-gray-400"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Scrollable History Area - Matches left column height */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-12 light:bg-gray-50 dark:bg-white/5 rounded-lg">
                <Sparkles className="w-10 h-10 mx-auto mb-3 light:text-gray-400 dark:text-gray-600" />
                <p className="text-sm font-medium light:text-gray-500 dark:text-gray-400">
                  No version history yet
                </p>
                <p className="text-xs light:text-gray-400 dark:text-gray-500 mt-1">
                  Create your first version to get started
                </p>
              </div>
            ) : (
              currentHistoryItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="p-3 rounded-lg light:bg-gray-50 dark:bg-white/5 light:hover:bg-blue-50 dark:hover:bg-blue-600/10 cursor-pointer transition-all group border light:border-gray-200 dark:border-white/5 light:hover:border-blue-300 dark:hover:border-blue-500/30 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold light:text-blue-600 dark:text-blue-400">
                      {item.version}
                    </span>
                    <span className="text-[10px] light:text-gray-500 dark:text-gray-500 font-medium">
                      {item.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {item.changelog.map((change, idx) => (
                      <p
                        key={idx}
                        className="text-[11px] light:text-gray-600 dark:text-gray-400 leading-relaxed"
                      >
                        • {change}
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t light:border-gray-200 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] light:text-blue-600 dark:text-blue-400 font-medium">
                      Click to load this version
                    </p>
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
