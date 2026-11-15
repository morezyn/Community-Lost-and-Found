"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "findit-theme";

/**
 * Minimal class-based dark mode toggle. Deliberately dependency-free: the
 * inline script in layout.tsx applies the stored theme before first paint.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private browsing can block storage - the toggle still works for this tab.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

export const THEME_STORAGE_KEY = STORAGE_KEY;

/** Runs before hydration to avoid a flash of the wrong theme. */
export const themeScript = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
