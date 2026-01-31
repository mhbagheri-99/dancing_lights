"use client";

import { useState, useCallback, useEffect } from "react";
import { useAudioContext } from "./useAudioContext";
import { useMicrophone, type MicrophoneError, type PermissionState } from "./useMicrophone";
import { useAnalyser } from "./useAnalyser";
import type { AnalyserData, VisualizerMode } from "@/visualizers/types";

interface VisualizerState {
  currentMode: VisualizerMode;
  isActive: boolean;
  isRequesting: boolean;
  permissionState: PermissionState;
  error: MicrophoneError | null;
}

interface UseVisualizerStateReturn extends VisualizerState {
  toggleMicrophone: () => Promise<void>;
  setMode: (mode: VisualizerMode) => void;
  getData: () => AnalyserData;
  cleanup: () => void;
}

export function useVisualizerState(): UseVisualizerStateReturn {
  const [currentMode, setCurrentMode] = useState<VisualizerMode>("bars");

  const { initializeAudioContext, connectSource, cleanup: cleanupAudio } = useAudioContext();
  const {
    isActive,
    isRequesting,
    permissionState,
    error,
    requestMicrophone,
    stopMicrophone,
  } = useMicrophone();
  const { getData, setAnalyser } = useAnalyser();

  const toggleMicrophone = useCallback(async () => {
    if (isActive) {
      stopMicrophone();
      setAnalyser(null);
    } else {
      try {
        // Initialize audio context first (needs user interaction)
        await initializeAudioContext();

        // Request microphone access
        const stream = await requestMicrophone();

        if (stream) {
          // Connect the stream to the analyser
          const analyser = connectSource(stream);
          setAnalyser(analyser);
        }
      } catch (err) {
        console.error("Failed to start audio:", err);
      }
    }
  }, [isActive, initializeAudioContext, requestMicrophone, stopMicrophone, connectSource, setAnalyser]);

  const setMode = useCallback((mode: VisualizerMode) => {
    setCurrentMode(mode);
  }, []);

  const cleanup = useCallback(() => {
    stopMicrophone();
    cleanupAudio();
    setAnalyser(null);
  }, [stopMicrophone, cleanupAudio, setAnalyser]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    currentMode,
    isActive,
    isRequesting,
    permissionState,
    error,
    toggleMicrophone,
    setMode,
    getData,
    cleanup,
  };
}
