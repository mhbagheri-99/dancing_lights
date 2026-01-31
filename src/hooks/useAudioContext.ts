"use client";

import { useRef, useState, useCallback } from "react";

interface AudioContextState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  isInitialized: boolean;
  error: Error | null;
}

interface UseAudioContextReturn extends AudioContextState {
  initializeAudioContext: () => Promise<AudioContext>;
  connectSource: (stream: MediaStream) => AnalyserNode | null;
  cleanup: () => void;
}

export function useAudioContext(): UseAudioContextReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const [state, setState] = useState<AudioContextState>({
    audioContext: null,
    analyser: null,
    isInitialized: false,
    error: null,
  });

  const initializeAudioContext = useCallback(async (): Promise<AudioContext> => {
    // Return existing context if already initialized
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      // Resume if suspended
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Create and configure analyser - super sensitive settings
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.15;  // Ultra fast response
      analyser.minDecibels = -80;              // Pick up quiet sounds
      analyser.maxDecibels = -20;              // Compress loud sounds for consistent energy
      analyserRef.current = analyser;

      setState({
        audioContext: ctx,
        analyser: analyser,
        isInitialized: true,
        error: null,
      });

      return ctx;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create AudioContext");
      setState((prev) => ({ ...prev, error, isInitialized: false }));
      throw error;
    }
  }, []);

  const connectSource = useCallback((stream: MediaStream): AnalyserNode | null => {
    if (!audioContextRef.current || !analyserRef.current) {
      console.error("AudioContext not initialized");
      return null;
    }

    // Disconnect existing source if any
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }

    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      sourceRef.current = source;
      return analyserRef.current;
    } catch (err) {
      console.error("Failed to connect audio source:", err);
      return null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState({
      audioContext: null,
      analyser: null,
      isInitialized: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    initializeAudioContext,
    connectSource,
    cleanup,
  };
}
