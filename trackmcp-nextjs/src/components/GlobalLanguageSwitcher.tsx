"use client";

import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

const APP_ROUTES = ["/dashboard", "/onboarding"];

export function GlobalLanguageSwitcher() {
  const pathname = usePathname();
  if (APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;

  return (
    <div className="global-language-switcher pointer-events-none fixed inset-x-0 top-[4.75rem] z-[70] hidden justify-end px-4 sm:top-3 sm:flex sm:px-6">
      <div className="pointer-events-auto">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
