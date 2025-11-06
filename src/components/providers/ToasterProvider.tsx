"use client";

import React from "react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            padding: "16px",
          },
          className: "toast-custom",
        }}
      />
    </>
  );
}
