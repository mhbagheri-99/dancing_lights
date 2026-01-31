"use client";

import { useRef, useCallback } from "react";
import type { AnalyserData } from "@/visualizers/types";
import { getAverageAmplitude, getPeakFrequencyIndex } from "@/utils/audioHelpers";

interface UseAnalyserReturn {
  getData: () => AnalyserData;
  setAnalyser: (analyser: AnalyserNode | null) => void;
}

export function useAnalyser(): UseAnalyserReturn {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const timeDomainDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const setAnalyser = useCallback((analyser: AnalyserNode | null) => {
    analyserRef.current = analyser;

    if (analyser) {
      // Pre-allocate typed arrays for performance
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDomainDataRef.current = new Uint8Array(analyser.fftSize);
    } else {
      frequencyDataRef.current = null;
      timeDomainDataRef.current = null;
    }
  }, []);

  const getData = useCallback((): AnalyserData => {
    const analyser = analyserRef.current;
    const frequencyData = frequencyDataRef.current;
    const timeDomainData = timeDomainDataRef.current;

    // Return empty data if not initialized
    if (!analyser || !frequencyData || !timeDomainData) {
      return {
        frequencyData: new Uint8Array(0),
        timeDomainData: new Uint8Array(0),
        averageFrequency: 0,
        peakFrequency: 0,
      };
    }

    // Update arrays with current audio data
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeDomainData);

    return {
      frequencyData,
      timeDomainData,
      averageFrequency: getAverageAmplitude(frequencyData),
      peakFrequency: getPeakFrequencyIndex(frequencyData),
    };
  }, []);

  return {
    getData,
    setAnalyser,
  };
}
