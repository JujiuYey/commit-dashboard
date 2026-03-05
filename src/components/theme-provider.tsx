import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";
import { useEffect } from "react";

import { useAppStore } from "@/stores/app";

function ColorThemeSync() {
  const color = useAppStore(s => s.settings.color);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.forEach(cls => {
      if (cls.startsWith("theme-")) root.classList.remove(cls);
    });
    if (color !== "zinc") {
      root.classList.add(`theme-${color}`);
    }
  }, [color]);

  return null;
}

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeSync />
      {children}
    </NextThemesProvider>
  );
}
