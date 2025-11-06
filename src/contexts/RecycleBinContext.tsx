"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  RecycleBinItem,
  RecycleBinItemSource,
  RecycleBinStats,
  RecycleBinFilters,
} from "@/types/recycleBin";

interface RecycleBinContextType {
  items: RecycleBinItem[];
  loading: boolean;
  stats: RecycleBinStats;
  moveToRecycleBin: (
    source: RecycleBinItemSource,
    data: any,
    originalId: string
  ) => Promise<void>;
  restoreItem: (recycleBinId: string) => Promise<any>;
  permanentlyDelete: (recycleBinId: string) => Promise<void>;
  permanentlyDeleteAll: () => Promise<void>;
  extendExpiry: (recycleBinId: string, days: 15 | 30) => Promise<void>;
  getFilteredItems: (filters?: RecycleBinFilters) => RecycleBinItem[];
  refreshItems: () => void;
}

const RecycleBinContext = createContext<RecycleBinContextType | undefined>(
  undefined
);

export const useRecycleBin = () => {
  const context = useContext(RecycleBinContext);
  if (!context) {
    throw new Error("useRecycleBin must be used within RecycleBinProvider");
  }
  return context;
};

interface RecycleBinProviderProps {
  children: ReactNode;
}

export const RecycleBinProvider: React.FC<RecycleBinProviderProps> = ({
  children,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RecycleBinStats>({
    total: 0,
    todos: 0,
    timesheets: 0,
    timeLogs: 0,
    notifications: 0,
    expiringWithin24Hours: 0,
  });

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load items from localStorage
  useEffect(() => {
    if (currentUserId) {
      loadItems();
    }
  }, [currentUserId]);

  // Update stats when items change
  useEffect(() => {
    updateStats();
  }, [items]);

  const loadItems = () => {
    if (!currentUserId) return;

    const stored = localStorage.getItem(`recycleBin_${currentUserId}`);
    if (stored) {
      try {
        const parsedItems = JSON.parse(stored);
        setItems(parsedItems);
      } catch (error) {
        console.error("Error loading recycle bin:", error);
        setItems([]);
      }
    }
  };

  const saveItems = useCallback(
    (updatedItems: RecycleBinItem[]) => {
      if (!currentUserId) return;

      localStorage.setItem(
        `recycleBin_${currentUserId}`,
        JSON.stringify(updatedItems)
      );
      setItems(updatedItems);
    },
    [currentUserId]
  );

  const updateStats = () => {
    const now = new Date().getTime();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    const newStats: RecycleBinStats = {
      total: items.length,
      todos: items.filter((item) => item.source === "todo").length,
      timesheets: items.filter((item) => item.source === "timesheet").length,
      timeLogs: items.filter((item) => item.source === "time-tracker").length,
      notifications: items.filter((item) => item.source === "notification")
        .length,
      expiringWithin24Hours: items.filter(
        (item) => new Date(item.expiryDate).getTime() <= oneDayFromNow
      ).length,
    };

    setStats(newStats);
  };

  const moveToRecycleBin = useCallback(
    async (
      source: RecycleBinItemSource,
      data: any,
      originalId: string
    ): Promise<void> => {
      if (!currentUserId) {
        toast.error("User not authenticated");
        return;
      }

      try {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // Default 15 days

        const recycleBinItem: RecycleBinItem = {
          id: `rb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalId,
          userId: currentUserId,
          source,
          data,
          deletedAt: now.toISOString(),
          expiryDate: expiryDate.toISOString(),
          expiryDays: 15,
          deletedBy: currentUserId,
        };

        const updatedItems = [...items, recycleBinItem];
        saveItems(updatedItems);

        toast.success(`Item moved to Recycle Bin (expires in 15 days)`, {
          description: "You can restore it or extend the expiry period.",
        });
      } catch (error) {
        console.error("Error moving to recycle bin:", error);
        toast.error("Failed to move item to Recycle Bin");
      }
    },
    [currentUserId, items, saveItems]
  );

  const restoreItem = useCallback(
    async (recycleBinId: string): Promise<any> => {
      const item = items.find((i) => i.id === recycleBinId);
      if (!item) {
        toast.error("Item not found");
        return null;
      }

      try {
        // Remove from recycle bin
        const updatedItems = items.filter((i) => i.id !== recycleBinId);
        saveItems(updatedItems);

        toast.success("Item restored successfully");
        return item.data; // Return the data so caller can restore it
      } catch (error) {
        console.error("Error restoring item:", error);
        toast.error("Failed to restore item");
        return null;
      }
    },
    [items, saveItems]
  );

  const permanentlyDelete = useCallback(
    async (recycleBinId: string): Promise<void> => {
      try {
        const updatedItems = items.filter((i) => i.id !== recycleBinId);
        saveItems(updatedItems);
        toast.success("Item permanently deleted");
      } catch (error) {
        console.error("Error permanently deleting:", error);
        toast.error("Failed to delete item");
      }
    },
    [items, saveItems]
  );

  const permanentlyDeleteAll = useCallback(async (): Promise<void> => {
    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    if (!confirm("Permanently delete all items? This cannot be undone!")) {
      return;
    }

    try {
      saveItems([]);
      toast.success("All items permanently deleted");
      // Refresh the page to show updated UI
      window.location.reload();
    } catch (error) {
      console.error("Error deleting all items:", error);
      toast.error("Failed to delete all items");
    }
  }, [currentUserId, saveItems]);

  const extendExpiry = useCallback(
    async (recycleBinId: string, days: 15 | 30): Promise<void> => {
      try {
        const updatedItems = items.map((item) => {
          if (item.id === recycleBinId) {
            const now = new Date();
            const newExpiryDate = new Date(
              now.getTime() + days * 24 * 60 * 60 * 1000
            );
            return {
              ...item,
              expiryDate: newExpiryDate.toISOString(),
              expiryDays: days,
            };
          }
          return item;
        });

        saveItems(updatedItems);
        toast.success(`Expiry extended to ${days} days`);
      } catch (error) {
        console.error("Error extending expiry:", error);
        toast.error("Failed to extend expiry");
      }
    },
    [items, saveItems]
  );

  const autoCleanupExpiredItems = useCallback(() => {
    if (!currentUserId) return;

    const now = new Date().getTime();
    const expiredItems = items.filter(
      (item) => new Date(item.expiryDate).getTime() <= now
    );

    if (expiredItems.length > 0) {
      const updatedItems = items.filter(
        (item) => new Date(item.expiryDate).getTime() > now
      );
      saveItems(updatedItems);

      toast.info(
        `${expiredItems.length} expired item(s) automatically deleted`,
        {
          description:
            "Items in Recycle Bin are automatically removed after expiry.",
        }
      );
    }
  }, [currentUserId, items, saveItems]);

  // Auto-cleanup expired items
  useEffect(() => {
    const interval = setInterval(() => {
      autoCleanupExpiredItems();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoCleanupExpiredItems]);

  const getFilteredItems = useCallback(
    (filters?: RecycleBinFilters): RecycleBinItem[] => {
      let filtered = [...items];

      if (filters?.source) {
        filtered = filtered.filter((item) => item.source === filters.source);
      }

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter((item) => {
          const dataStr = JSON.stringify(item.data).toLowerCase();
          return dataStr.includes(term) || item.source.includes(term);
        });
      }

      // Sort
      const sortBy = filters?.sortBy || "deletedAt";
      const sortOrder = filters?.sortOrder || "desc";

      filtered.sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
          case "deletedAt":
            aVal = new Date(a.deletedAt).getTime();
            bVal = new Date(b.deletedAt).getTime();
            break;
          case "expiryDate":
            aVal = new Date(a.expiryDate).getTime();
            bVal = new Date(b.expiryDate).getTime();
            break;
          case "source":
            aVal = a.source;
            bVal = b.source;
            break;
          default:
            return 0;
        }

        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      return filtered;
    },
    [items]
  );

  const refreshItems = useCallback(() => {
    loadItems();
  }, [currentUserId]);

  const value: RecycleBinContextType = {
    items,
    loading,
    stats,
    moveToRecycleBin,
    restoreItem,
    permanentlyDelete,
    permanentlyDeleteAll,
    extendExpiry,
    getFilteredItems,
    refreshItems,
  };

  return (
    <RecycleBinContext.Provider value={value}>
      {children}
    </RecycleBinContext.Provider>
  );
};
