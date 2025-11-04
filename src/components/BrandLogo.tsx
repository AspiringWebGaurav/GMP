import React from "react";

export default function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GMP logo"
    >
      <rect width="48" height="48" rx="10" fill="url(#g)" />
      <path d="M12 34V14h6l8 10v10h-6v-8l-8 8" fill="white" />
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#6EE7B7" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
