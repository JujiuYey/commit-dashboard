import { IconCheck, IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ThemeColor, type ThemeMode, useAppStore } from "@/stores/app";

const modes: { value: ThemeMode; label: string; icon: typeof IconSun }[] = [
  { value: "light", label: "浅色", icon: IconSun },
  { value: "dark", label: "深色", icon: IconMoon },
  { value: "system", label: "跟随系统", icon: IconSunMoon },
];

const colorGroups: { label: string; colors: { value: ThemeColor; label: string; swatch: string }[] }[] = [
  {
    label: "中性色",
    colors: [
      { value: "zinc", label: "Zinc", swatch: "bg-[oklch(20.5%_0_0deg)]" },
      { value: "slate", label: "Slate", swatch: "bg-[oklch(27.9%_0.041_260.031deg)]" },
      { value: "stone", label: "Stone", swatch: "bg-[oklch(26.8%_0.007_34.298deg)]" },
    ],
  },
  {
    label: "红 / 暖色",
    colors: [
      { value: "red", label: "Red", swatch: "bg-[oklch(57.7%_0.245_27.325deg)]" },
      { value: "rose", label: "Rose", swatch: "bg-[oklch(58.7%_0.242_16.935deg)]" },
      { value: "pink", label: "Pink", swatch: "bg-[oklch(59.2%_0.249_0.584deg)]" },
      { value: "fuchsia", label: "Fuchsia", swatch: "bg-[oklch(59.1%_0.293_322.896deg)]" },
      { value: "orange", label: "Orange", swatch: "bg-[oklch(70.5%_0.213_47.604deg)]" },
      { value: "amber", label: "Amber", swatch: "bg-[oklch(76.9%_0.188_70.08deg)]" },
      { value: "yellow", label: "Yellow", swatch: "bg-[oklch(79.5%_0.184_86.047deg)]" },
    ],
  },
  {
    label: "绿 / 青色",
    colors: [
      { value: "emerald", label: "Emerald", swatch: "bg-[oklch(59.6%_0.145_163.225deg)]" },
      { value: "green", label: "Green", swatch: "bg-[oklch(51.5%_0.177_142.495deg)]" },
      { value: "teal", label: "Teal", swatch: "bg-[oklch(60%_0.118_184.704deg)]" },
      { value: "cyan", label: "Cyan", swatch: "bg-[oklch(65.5%_0.136_205.1deg)]" },
    ],
  },
  {
    label: "蓝 / 紫色",
    colors: [
      { value: "sky", label: "Sky", swatch: "bg-[oklch(62.5%_0.177_231.571deg)]" },
      { value: "blue", label: "Blue", swatch: "bg-[oklch(54.6%_0.245_262.881deg)]" },
      { value: "indigo", label: "Indigo", swatch: "bg-[oklch(50.8%_0.249_281.37deg)]" },
      { value: "violet", label: "Violet", swatch: "bg-[oklch(54.1%_0.281_293.009deg)]" },
      { value: "purple", label: "Purple", swatch: "bg-[oklch(55.3%_0.273_306.281deg)]" },
    ],
  },
];

export function ThemePage() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useAppStore();

  const handleModeChange = (mode: ThemeMode) => {
    setTheme(mode);
    updateSettings({ theme: mode });
  };

  const handleColorChange = (color: ThemeColor) => {
    updateSettings({ color });
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">主题设置</h1>

      <Card>
        <CardHeader>
          <CardTitle>外观模式</CardTitle>
          <CardDescription>选择浅色、深色或跟随系统设置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {modes.map(mode => (
              <Button
                key={mode.value}
                variant={theme === mode.value ? "default" : "outline"}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => handleModeChange(mode.value)}
              >
                <mode.icon className="size-5" />
                <span className="text-sm">{mode.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>主题色</CardTitle>
          <CardDescription>选择应用的主色调</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {colorGroups.map(group => (
            <div key={group.label} className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {group.colors.map(color => (
                  <button
                    key={color.value}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/50",
                      settings.color === color.value && "border-primary bg-muted/50",
                    )}
                    onClick={() => handleColorChange(color.value)}
                  >
                    <span className={cn("size-4 rounded-full shrink-0", color.swatch)} />
                    <span className="text-sm font-medium">{color.label}</span>
                    {settings.color === color.value && (
                      <IconCheck className="ml-auto size-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
