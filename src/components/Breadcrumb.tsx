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
    <nav className="bg-gray-50/50 border-b border-gray-200">
      <div className="px-4 md:px-6 py-1.5 md:py-2.5">
        <ol className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-hide">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={`${crumb.href}-${index}`}
                className="flex items-center gap-1 group"
              >
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                {isLast || !crumb.href ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/15 text-blue-700 font-medium whitespace-nowrap">
                    {crumb.isHome && <Home className="w-3.5 h-3.5" />}
                    <span className="text-xs">{crumb.label}</span>
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all whitespace-nowrap"
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
