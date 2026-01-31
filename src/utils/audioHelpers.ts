// Audio processing utilities

export function checkMicrophoneSupport(): {
  supported: boolean;
  secureContext: boolean;
  getUserMediaAvailable: boolean;
} {
  return {
    supported: !!(navigator.mediaDevices?.getUserMedia),
    secureContext: typeof window !== "undefined" && window.isSecureContext,
    getUserMediaAvailable: typeof navigator !== "undefined" && "mediaDevices" in navigator,
  };
}

export type MicrophoneErrorType =
  | "NotFoundError"
  | "NotAllowedError"
  | "NotReadableError"
  | "SecurityError"
  | "OverconstrainedError"
  | "Unknown";

export function getMicrophoneErrorMessage(error: Error): {
  type: MicrophoneErrorType;
  message: string;
} {
  const errorMap: Record<string, { type: MicrophoneErrorType; message: string }> = {
    NotFoundError: {
      type: "NotFoundError",
      message: "No microphone found. Please connect a microphone and try again.",
    },
    NotAllowedError: {
      type: "NotAllowedError",
      message: "Microphone access denied. Please allow access in your browser settings.",
    },
    NotReadableError: {
      type: "NotReadableError",
      message: "Microphone is in use by another application. Please close other apps using the mic.",
    },
    SecurityError: {
      type: "SecurityError",
      message: "Microphone access requires HTTPS. Please use a secure connection.",
    },
    OverconstrainedError: {
      type: "OverconstrainedError",
      message: "No microphone meets the requested requirements.",
    },
  };

  return (
    errorMap[error.name] || {
      type: "Unknown" as MicrophoneErrorType,
      message: `Unexpected error: ${error.message}`,
    }
  );
}

// Calculate average amplitude from frequency data
export function getAverageAmplitude(data: Uint8Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / data.length / 255;
}

// Find peak frequency index
export function getPeakFrequencyIndex(data: Uint8Array): number {
  let maxValue = 0;
  let maxIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > maxValue) {
      maxValue = data[i];
      maxIndex = i;
    }
  }
  return maxIndex;
}

// Get bass energy (low frequencies)
export function getBassEnergy(data: Uint8Array): number {
  const bassRange = Math.floor(data.length * 0.1); // First 10% of frequencies
  let sum = 0;
  for (let i = 0; i < bassRange; i++) {
    sum += data[i];
  }
  return sum / bassRange / 255;
}

// Get treble energy (high frequencies)
export function getTrebleEnergy(data: Uint8Array): number {
  const trebleStart = Math.floor(data.length * 0.7);
  let sum = 0;
  let count = 0;
  for (let i = trebleStart; i < data.length; i++) {
    sum += data[i];
    count++;
  }
  return count > 0 ? sum / count / 255 : 0;
}

// Smooth transition between values
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

// Logarithmic frequency distribution for better visual representation
export function getLogarithmicIndex(
  linearIndex: number,
  totalBars: number,
  dataLength: number
): number {
  // Using 1.2 instead of 1.5 for more even frequency distribution across all bars
  const logScale = Math.pow(linearIndex / totalBars, 1.2);
  return Math.floor(logScale * dataLength);
}
