"use client";

import type { VisualizerMode } from "@/visualizers/types";

interface ModeSelectorProps {
  currentMode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
}

const modes: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
  { id: "bars", label: "Bars", icon: <BarsIcon /> },
  { id: "waveform", label: "Wave", icon: <WaveIcon /> },
  { id: "scope", label: "Scope", icon: <ScopeIcon /> },
  { id: "ambiance", label: "Ambiance", icon: <AmbianceIcon /> },
];

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--bg-secondary)]">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`mode-button flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            currentMode === mode.id
              ? "active"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          aria-label={`Switch to ${mode.label} visualizer`}
          title={mode.label}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

// Mode Icons
function BarsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="10" width="3" height="10" rx="1" />
      <rect x="9" y="6" width="3" height="14" rx="1" />
      <rect x="14" y="8" width="3" height="12" rx="1" />
      <rect x="19" y="12" width="3" height="8" rx="1" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12c.6-.5 1.2-1.5 2-1.5s1.4 1 2 1.5c.6.5 1.2 1.5 2 1.5s1.4-1 2-1.5c.6-.5 1.2-1.5 2-1.5s1.4 1 2 1.5c.6.5 1.2 1.5 2 1.5s1.4-1 2-1.5c.6-.5 1.2-1.5 2-1.5s1.4 1 2 1.5" />
    </svg>
  );
}

function ScopeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function AmbianceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="7" cy="12" r="3" opacity="0.8" />
      <circle cx="17" cy="8" r="2" opacity="0.6" />
      <circle cx="12" cy="16" r="2.5" opacity="0.7" />
      <circle cx="18" cy="15" r="1.5" opacity="0.5" />
      <circle cx="5" cy="7" r="1.5" opacity="0.5" />
    </svg>
  );
}
