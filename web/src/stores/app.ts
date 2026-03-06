import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";
export type ThemeColor =
  | "zinc" | "slate" | "stone"
  | "red" | "rose" | "orange" | "amber" | "yellow"
  | "emerald" | "green" | "teal" | "cyan"
  | "sky" | "blue" | "indigo" | "violet" | "purple" | "fuchsia" | "pink";

interface AppSettings {
  autoSave: boolean;
  theme: ThemeMode;
  color: ThemeColor;
}

interface AppState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  autoSave: true,
  theme: "system",
  color: "indigo",
};

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      settings: { ...defaultSettings },
      updateSettings: (partial) =>
        set(state => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () =>
        set({ settings: { ...defaultSettings } }),
    }),
    {
      name: "app-setting",
    },
  ),
);
