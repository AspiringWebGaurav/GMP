"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  activeTab?: string;
  customItems?: Array<{ label: string; href?: string }>;
}

export default function Breadcrumb({
  activeTab,
  customItems,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter((path) => path);

    const breadcrumbs: Array<{
      label: string;
      href?: string;
      isHome: boolean;
    }> = [{ label: "Home", href: "/", isHome: true }];

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      // Capitalize and format the path name
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: currentPath,
        isHome: false,
      });
    });

    // Add active tab if provided
    if (activeTab) {
      breadcrumbs.push({
        label: activeTab,
        isHome: false,
      });
    }

    // Add custom items if provided
    if (customItems && customItems.length > 0) {
      customItems.forEach((item) => {
        breadcrumbs.push({
          label: item.label,
          href: item.href,
          isHome: false,
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page
  if (pathname === "/" && !activeTab && !customItems) {
    return null;
  }

  return (
    <nav className="light:bg-gray-50/50 dark:bg-linear-to-r dark:from-slate-900/30 dark:via-slate-800/20 dark:to-transparent border-b light:border-gray-200 dark:border-white/10">
      <div className="px-4 md:px-6 py-2.5">
        <ol className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-hide">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={`${crumb.href}-${index}`}
                className="flex items-center gap-1 group"
              >
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 light:text-gray-400 dark:text-gray-600 shrink-0" />
                )}
                {isLast || !crumb.href ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/15 light:text-blue-700 dark:text-blue-400 font-medium whitespace-nowrap">
                    {crumb.isHome && <Home className="w-3.5 h-3.5" />}
                    <span className="text-xs">{crumb.label}</span>
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md light:text-gray-600 dark:text-gray-400 light:hover:text-gray-900 dark:hover:text-white light:hover:bg-gray-100 dark:hover:bg-white/5 transition-all whitespace-nowrap"
                  >
                    {crumb.isHome && <Home className="w-3.5 h-3.5" />}
                    <span className="text-xs">{crumb.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
