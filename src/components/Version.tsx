"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { VERSION } from "../app/config/version";

export default function Version() {
  const [version, setVersion] = useState(VERSION);

  useEffect(() => {
    // Load version from Firestore
    const loadVersion = async () => {
      try {
        const versionDoc = await getDoc(doc(db, "appSettings", "version"));
        if (versionDoc.exists()) {
          setVersion(versionDoc.data()?.version || VERSION);
        }
      } catch (error) {
        console.error("Error loading version:", error);
      }
    };

    loadVersion();
  }, []);

  return (
    <span className="text-sm text-gray-600">
      {version}
    </span>
  );
}
