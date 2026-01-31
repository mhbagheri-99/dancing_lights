"use client";

import type { MicrophoneError, PermissionState } from "@/hooks/useMicrophone";

interface MicrophoneButtonProps {
  isActive: boolean;
  isRequesting: boolean;
  permissionState: PermissionState;
  error: MicrophoneError | null;
  onClick: () => void;
}

export function MicrophoneButton({
  isActive,
  isRequesting,
  permissionState,
  error,
  onClick,
}: MicrophoneButtonProps) {
  const getButtonContent = () => {
    if (isRequesting) {
      return (
        <>
          <LoadingSpinner />
          <span>Requesting...</span>
        </>
      );
    }

    if (isActive) {
      return (
        <>
          <MicActiveIcon />
          <span>Stop</span>
        </>
      );
    }

    if (permissionState === "denied") {
      return (
        <>
          <MicBlockedIcon />
          <span>Blocked</span>
        </>
      );
    }

    if (permissionState === "unavailable") {
      return (
        <>
          <MicOffIcon />
          <span>Unavailable</span>
        </>
      );
    }

    return (
      <>
        <MicIcon />
        <span>Start</span>
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass =
      "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ";

    if (isActive) {
      return baseClass + "bg-[var(--accent-green)] text-[var(--bg-primary)] pulse-glow";
    }

    if (permissionState === "denied" || permissionState === "unavailable") {
      return baseClass + "bg-red-500/20 text-red-400 cursor-not-allowed";
    }

    if (isRequesting) {
      return baseClass + "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-wait";
    }

    return (
      baseClass +
      "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] hover:glow-blue"
    );
  };

  const isDisabled =
    isRequesting || permissionState === "denied" || permissionState === "unavailable";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={getButtonClass()}
        aria-label={isActive ? "Stop microphone" : "Start microphone"}
      >
        {getButtonContent()}
      </button>

      {error && (
        <p className="text-red-400 text-sm max-w-xs text-center">{error.message}</p>
      )}
    </div>
  );
}

// Icons as inline SVG components
function MicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicActiveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0a0a0f"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicBlockedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
    </svg>
  );
}
