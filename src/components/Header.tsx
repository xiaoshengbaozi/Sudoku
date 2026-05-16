import { type ReactNode, useState } from "react";
import { BarChart3, Crown, Moon, Settings2, Sun, Trophy, Vibrate, Volume2 } from "lucide-react";
import type { Theme } from "../types";

export function Header({
  theme,
  onThemeChange,
  soundEnabled,
  vibrationEnabled,
  onToggleSound,
  onToggleVibration,
  onOpenStats,
  onOpenAchievements,
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onOpenStats: () => void;
  onOpenAchievements: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#ff6b4a] text-white shadow-lg shadow-[#ff6b4a]/30">
          <Crown size={22} fill="currentColor" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold">准备开始</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton label="统计" onClick={onOpenStats}>
          <BarChart3 size={20} />
        </IconButton>
        <IconButton label="成就" onClick={onOpenAchievements}>
          <Trophy size={20} />
        </IconButton>
        <IconButton
          label={settingsOpen ? "关闭设置" : "打开设置"}
          onClick={() => setSettingsOpen((v) => !v)}
          pressed={settingsOpen}
        >
          <Settings2 size={20} />
        </IconButton>
      </div>

      {settingsOpen ? (
        <div className="settings-menu absolute right-1 top-14 z-20 w-48 rounded-2xl p-2 shadow-glow">
          <ToggleOption
            enabled={theme === "dark"}
            icon={theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
            label={theme === "dark" ? "深色模式" : "亮色模式"}
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          />
          <ToggleOption
            enabled={soundEnabled}
            icon={<Volume2 size={17} />}
            label="音效"
            onClick={onToggleSound}
          />
          <ToggleOption
            enabled={vibrationEnabled}
            icon={<Vibrate size={17} />}
            label="震动"
            onClick={onToggleVibration}
          />
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  pressed,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className="toolbar-button grid h-11 w-11 place-items-center rounded-full transition active:scale-95"
    >
      {children}
    </button>
  );
}

function ToggleOption({
  enabled,
  icon,
  label,
  onClick,
}: {
  enabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold transition hover:bg-white/5"
    >
      <span className={`flex items-center gap-2 transition-opacity ${enabled ? "" : "opacity-40"}`}>
        {icon}
        {label}
      </span>
      <span
        className={`relative inline-flex h-5 w-10 shrink-0 rounded-full transition-all duration-300 ${
          enabled
            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]"
            : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-[1px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-300 ease-out ${
            enabled ? "translate-x-[21px]" : "translate-x-[1px]"
          }`}
        />
      </span>
    </button>
  );
}
