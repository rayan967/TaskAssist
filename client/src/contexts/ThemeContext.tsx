import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Create context with default values to avoid undefined errors
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  
  // Initialize theme after component is mounted
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));
  }, []);
  
  useEffect(() => {
    if (!mounted) return;

    // Update the data-theme attribute on the document element
    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    
    // Save theme preference
    localStorage.setItem("theme", theme);
    
    // Force repaint to apply theme changes
    document.body.style.backgroundColor = theme === "dark" ? "#111827" : "#f9fafb";
    setTimeout(() => {
      document.body.style.backgroundColor = "";
    }, 10);
    
  }, [theme, mounted]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"));
  };
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
