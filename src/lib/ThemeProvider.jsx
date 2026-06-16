import { useEffect } from "react";

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const applyTheme = (e) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(mql);
    mql.addEventListener("change", applyTheme);
    return () => mql.removeEventListener("change", applyTheme);
  }, []);

  return children;
}