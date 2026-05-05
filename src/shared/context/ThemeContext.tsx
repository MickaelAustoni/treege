import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { COLORS, ThemeColors } from "@/shared/constants/colors";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  theme?: "dark" | "light";
}

interface ThemeProviderState {
  colors: ThemeColors;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  colors: COLORS.light,
  setTheme: () => null,
  theme: "system",
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = "treege-theme",
  theme: controlledTheme,
  ...props
}: ThemeProviderProps) => {
  const [internalTheme, setInternalTheme] = useState<Theme>(() => {
    // If controlled, use controlled theme and ignore localStorage
    if (controlledTheme) {
      return controlledTheme;
    }

    // Otherwise, use localStorage or default
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  // Use controlled theme if provided, otherwise use internal state
  const theme = controlledTheme ?? internalTheme;

  // For web, we use CSS classes (Tailwind dark:), but provide colors for API compatibility
  // The resolved theme is used to determine which color palette to expose
  const resolvedTheme =
    theme === "system"
      ? typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const colors = COLORS[resolvedTheme];

  const value = useMemo(
    () => ({
      colors,
      setTheme: (newTheme: Theme) => {
        // Don't update localStorage if controlled
        if (!controlledTheme && typeof window !== "undefined") {
          localStorage.setItem(storageKey, newTheme);
        }
        setInternalTheme(newTheme);
      },
      theme,
    }),
    [storageKey, theme, controlledTheme, colors],
  );

  /**
   * Sync the internal state to the controlled `theme` prop whenever it
   * changes — keeps internal state ready to take over if the consumer
   * stops passing `theme` later.
   */
  useEffect(() => {
    if (controlledTheme) {
      setInternalTheme(controlledTheme);
    }
  }, [controlledTheme]);

  /**
   * Apply the resolved theme to the document root by toggling the `light` /
   * `dark` class. When `theme === "system"`, also subscribe to the OS-level
   * `prefers-color-scheme` media query so the class follows OS changes live.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      root.classList.add(systemTheme);
      const listener = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    root.classList.add(theme);
    return undefined;
  }, [theme]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
