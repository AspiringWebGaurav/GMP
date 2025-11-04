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
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";

interface VersionHistory {
  id: string;
  version: string;
  changelog: string[];
  createdAt: Date;
}

export default function VersionNotesManager() {
  const [version, setVersion] = useState("");
  const [changelogInput, setChangelogInput] = useState("");
  const [changelog, setChangelog] = useState<string[]>([]);
  const [history, setHistory] = useState<VersionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyQuery = query(
        collection(db, "versionHistory"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as VersionHistory[];
      setHistory(historyData);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const addChangelogItem = () => {
    if (changelogInput.trim()) {
      setChangelog([...changelog, changelogInput.trim()]);
      setChangelogInput("");
    }
  };

  const removeChangelogItem = (index: number) => {
    setChangelog(changelog.filter((_, i) => i !== index));
  };

  const isVersionExists = (ver: string) => {
    return history.some(
      (item) => item.version.toLowerCase() === ver.toLowerCase()
    );
  };

  const isSaveDisabled = () => {
    return (
      !version.trim() ||
      changelog.length === 0 ||
      isVersionExists(version.trim()) ||
      saving
    );
  };

  const saveVersion = async () => {
    if (isSaveDisabled()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "versionHistory"), {
        version: version.trim(),
        changelog: changelog,
        createdAt: Timestamp.now(),
      });
      toast.success("Version saved!");
      setVersion("");
      setChangelog([]);
      loadHistory();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const versionExists = version.trim() && isVersionExists(version.trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-xl font-bold light:text-gray-900 dark:text-white mb-4 shrink-0">
          Add New Version
        </h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
          <div>
            <label className="block text-sm font-medium light:text-gray-700 dark:text-gray-300 mb-2">
              Version Number *
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v1.0.0"
              className={`w-full px-4 py-2.5 rounded-lg border light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                versionExists
                  ? "border-red-500 focus:ring-red-500"
                  : "light:border-gray-300 dark:border-white/10 focus:ring-blue-500"
              }`}
            />
            {versionExists && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ This version already exists
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium light:text-gray-700 dark:text-gray-300 mb-2">
              Changelog Items *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={changelogInput}
                onChange={(e) => setChangelogInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChangelogItem();
                  }
                }}
                placeholder="Type and press Enter"
                className="flex-1 px-4 py-2.5 rounded-lg border light:border-gray-300 dark:border-white/10 light:bg-white dark:bg-black/20 light:text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addChangelogItem}
                disabled={!changelogInput.trim()}
                className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
            <p className="text-xs light:text-gray-500 dark:text-gray-400 mt-1">
              Press Enter or click Add
            </p>
          </div>
          {changelog.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium light:text-gray-700 dark:text-gray-300">
                Added Items ({changelog.length})
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                {changelog.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-2 p-3 rounded-lg light:bg-gray-100 dark:bg-white/5 group"
                  >
                    <span className="light:text-gray-900 dark:text-white text-sm flex-1">
                      • {item}
                    </span>
                    <button
                      onClick={() => removeChangelogItem(index)}
                      className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={saveVersion}
          disabled={isSaveDisabled()}
          className="w-full px-6 py-3 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shrink-0"
          title={
            !version.trim()
              ? "Enter version number"
              : changelog.length === 0
              ? "Add at least one changelog item"
              : versionExists
              ? "This version already exists"
              : "Save version"
          }
        >
          {saving ? "Saving..." : "Save Version"}
        </button>
      </div>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-bold light:text-gray-900 dark:text-white">
            Version History
          </h2>
          <span className="text-xs light:text-gray-500 dark:text-gray-400 font-medium">
            {history.length} version{history.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full light:bg-gray-50 dark:bg-white/5 rounded-lg p-8">
              <div className="text-4xl mb-3">���</div>
              <p className="light:text-gray-500 dark:text-gray-400 font-medium">
                No versions yet
              </p>
              <p className="text-xs light:text-gray-400 dark:text-gray-500 mt-1">
                Create your first version
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg light:bg-gray-50 dark:bg-white/5 border light:border-gray-200 dark:border-white/10 hover:light:bg-gray-100 hover:dark:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-base light:text-gray-900 dark:text-white">
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
                      className="text-sm light:text-gray-600 dark:text-gray-400"
                    >
                      • {change}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
