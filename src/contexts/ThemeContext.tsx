"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen to auth state and load theme from Firestore
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        // Load theme from Firestore
        try {
          const userDoc = await getDoc(doc(db, "userPreferences", user.uid));
          if (userDoc.exists()) {
            const savedTheme = userDoc.data()?.theme as Theme;
            if (savedTheme) {
              setTheme(savedTheme);
              document.documentElement.classList.toggle(
                "light",
                savedTheme === "light"
              );
            }
          }
        } catch (error) {
          console.error("Error loading theme from server:", error);
        }
      } else {
        setUserId(null);
        // Use default dark theme when not logged in
        setTheme("dark");
        document.documentElement.classList.remove("light");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");

    // Save to Firestore if user is logged in
    if (userId) {
      try {
        await setDoc(
          doc(db, "userPreferences", userId),
          { theme: newTheme, updatedAt: new Date() },
          { merge: true }
        );
      } catch (error) {
        console.error("Error saving theme to server:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
