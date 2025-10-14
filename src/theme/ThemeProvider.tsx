import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Mode = "light" | "dark";
type Theme = {
  bg: string; card: string; text: string; sub: string; border: string; brand: string; muted: string;
};

const Light: Theme = {
  bg: "#F8FAFC", card: "#FFFFFF", text: "#101828", sub: "#667085", border: "#E5E7EB", brand: "#FF7A2F", muted: "#F3F4F6",
};
const Dark: Theme = {
  bg: "#0B0F14", card: "#12171E", text: "#E6ECEF", sub: "#9AA7B0", border: "#25303A", brand: "#FF8A47", muted: "#1A222B",
};

const Ctx = createContext<{mode: Mode; colors: Theme; setMode:(m:Mode)=>void}>({mode:"light", colors: Light, setMode:()=>{}});
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("app_theme_mode");
      if (saved === "light" || saved === "dark") setMode(saved);
      else setMode(Appearance.getColorScheme() === "dark" ? "dark" : "light");
    })();
  }, []);
  useEffect(() => { AsyncStorage.setItem("app_theme_mode", mode).catch(()=>{}); }, [mode]);
  const colors = useMemo(()=> mode==="dark"? Dark: Light, [mode]);
  return <Ctx.Provider value={{ mode, colors, setMode }}>{children}</Ctx.Provider>;
}
export const useTheme = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};