"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getMicrophoneErrorMessage, type MicrophoneErrorType } from "@/utils/audioHelpers";

export type PermissionState = "prompt" | "granted" | "denied" | "unavailable";

export interface MicrophoneError {
  type: MicrophoneErrorType;
  message: string;
}

interface MicrophoneState {
  stream: MediaStream | null;
  permissionState: PermissionState;
  isActive: boolean;
  isRequesting: boolean;
  error: MicrophoneError | null;
}

interface UseMicrophoneReturn extends MicrophoneState {
  requestMicrophone: () => Promise<MediaStream | null>;
  stopMicrophone: () => void;
}

export function useMicrophone(): UseMicrophoneReturn {
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<MicrophoneState>({
    stream: null,
    permissionState: "prompt",
    isActive: false,
    isRequesting: false,
    error: null,
  });

  // Check initial permission state
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      return;
    }

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        setState((prev) => ({
          ...prev,
          permissionState: result.state as PermissionState,
        }));

        result.onchange = () => {
          setState((prev) => ({
            ...prev,
            permissionState: result.state as PermissionState,
          }));
        };
      })
      .catch(() => {
        // Permissions API not supported, will handle on request
      });
  }, []);

  // Check if microphone is available (requires secure context: HTTPS or localhost)
  useEffect(() => {
    const isSecureContext = typeof window !== "undefined" && (
      window.isSecureContext ||
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const message = !isSecureContext
        ? "Microphone requires HTTPS. Please access this site via HTTPS or localhost."
        : "Microphone access is not supported in this browser.";

      setState((prev) => ({
        ...prev,
        permissionState: "unavailable",
        error: {
          type: "SecurityError",
          message,
        },
      }));
    }
  }, []);

  const requestMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    // Check if already active
    if (streamRef.current && state.isActive) {
      return streamRef.current;
    }

    // Check if getUserMedia is available (requires secure context)
    if (!navigator.mediaDevices?.getUserMedia) {
      const isSecureContext = window.isSecureContext ||
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      setState((prev) => ({
        ...prev,
        permissionState: "unavailable",
        error: {
          type: "SecurityError",
          message: isSecureContext
            ? "Microphone access is not supported in this browser."
            : "Microphone requires HTTPS. Please access this site via HTTPS or localhost.",
        },
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isRequesting: true, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      setState({
        stream,
        permissionState: "granted",
        isActive: true,
        isRequesting: false,
        error: null,
      });

      return stream;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      const micError = getMicrophoneErrorMessage(error);

      setState((prev) => ({
        ...prev,
        stream: null,
        permissionState: error.name === "NotAllowedError" ? "denied" : prev.permissionState,
        isActive: false,
        isRequesting: false,
        error: micError,
      }));

      return null;
    }
  }, [state.isActive]);

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      stream: null,
      isActive: false,
      isRequesting: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    requestMicrophone,
    stopMicrophone,
  };
}
