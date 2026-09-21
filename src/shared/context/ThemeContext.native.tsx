import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { COLORS, ThemeColors } from "@/shared/constants/colors";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  theme?: "dark" | "light";
  /** Overrides merged over the palette of the resolved theme (used by the React Native renderer) */
  colors?: Partial<ThemeColors>;
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

/**
 * ThemeProvider for React Native
 * Unlike the web version, this doesn't manipulate DOM classes
 * Provides theme colors directly through the context
 */
export const ThemeProvider = ({
  children,
  colors: colorOverrides,
  defaultTheme = "system",
  theme: controlledTheme,
  ...props
}: ThemeProviderProps) => {
  const deviceColorScheme = useColorScheme();
  const [internalTheme, setInternalTheme] = useState<Theme>(() => {
    // If controlled, use controlled theme
    if (controlledTheme) {
      return controlledTheme;
    }
    return defaultTheme;
  });

  // Use controlled theme if provided, otherwise use internal state
  const theme = controlledTheme ?? internalTheme;

  // Resolve "system" to actual device preference and get colors
  const resolvedTheme = theme === "system" ? (deviceColorScheme ?? "light") : theme;
  const colors = useMemo(() => ({ ...COLORS[resolvedTheme], ...colorOverrides }), [resolvedTheme, colorOverrides]);

  const value = useMemo(
    () => ({
      colors,
      setTheme: (newTheme: Theme) => {
        setInternalTheme(newTheme);
      },
      theme,
    }),
    [theme, colors],
  );

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
