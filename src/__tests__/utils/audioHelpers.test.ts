import { describe, it, expect } from "vitest";
import {
  checkMicrophoneSupport,
  getMicrophoneErrorMessage,
  getAverageAmplitude,
  getPeakFrequencyIndex,
  getBassEnergy,
  getTrebleEnergy,
  lerp,
  getLogarithmicIndex,
} from "@/utils/audioHelpers";

describe("audioHelpers", () => {
  describe("checkMicrophoneSupport", () => {
    it("should detect microphone support correctly", () => {
      const result = checkMicrophoneSupport();
      expect(result).toHaveProperty("supported");
      expect(result).toHaveProperty("secureContext");
      expect(result).toHaveProperty("getUserMediaAvailable");
      expect(typeof result.supported).toBe("boolean");
    });
  });

  describe("getMicrophoneErrorMessage", () => {
    it("should return correct message for NotFoundError", () => {
      const error = new Error("No mic");
      error.name = "NotFoundError";
      const result = getMicrophoneErrorMessage(error);
      expect(result.type).toBe("NotFoundError");
      expect(result.message).toContain("No microphone found");
    });

    it("should return correct message for NotAllowedError", () => {
      const error = new Error("Denied");
      error.name = "NotAllowedError";
      const result = getMicrophoneErrorMessage(error);
      expect(result.type).toBe("NotAllowedError");
      expect(result.message).toContain("denied");
    });

    it("should return correct message for NotReadableError", () => {
      const error = new Error("In use");
      error.name = "NotReadableError";
      const result = getMicrophoneErrorMessage(error);
      expect(result.type).toBe("NotReadableError");
      expect(result.message).toContain("in use");
    });

    it("should return correct message for SecurityError", () => {
      const error = new Error("HTTPS");
      error.name = "SecurityError";
      const result = getMicrophoneErrorMessage(error);
      expect(result.type).toBe("SecurityError");
      expect(result.message).toContain("HTTPS");
    });

    it("should return correct message for OverconstrainedError", () => {
      const error = new Error("Constrained");
      error.name = "OverconstrainedError";
      const result = getMicrophoneErrorMessage(error);
      expect(result.type).toBe("OverconstrainedError");
    });

    it("should return Unknown for unrecognized errors", () => {
      const error = new Error("Something weird");
      error.name = "WeirdError";
      const result = getMicrophoneErrorMessage(error);
      expect(result.type).toBe("Unknown");
      expect(result.message).toContain("Something weird");
    });
  });

  describe("getAverageAmplitude", () => {
    it("should return 0 for empty array", () => {
      const data = new Uint8Array(0);
      expect(getAverageAmplitude(data)).toBe(0);
    });

    it("should return correct average for uniform data", () => {
      const data = new Uint8Array([255, 255, 255, 255]);
      expect(getAverageAmplitude(data)).toBe(1); // 255/255 = 1
    });

    it("should return 0 for all zeros", () => {
      const data = new Uint8Array([0, 0, 0, 0]);
      expect(getAverageAmplitude(data)).toBe(0);
    });

    it("should return correct average for mixed data", () => {
      const data = new Uint8Array([0, 128, 255]); // Average = 127.67
      const result = getAverageAmplitude(data);
      expect(result).toBeCloseTo(127.67 / 255, 2);
    });
  });

  describe("getPeakFrequencyIndex", () => {
    it("should return 0 for empty array", () => {
      const data = new Uint8Array(0);
      expect(getPeakFrequencyIndex(data)).toBe(0);
    });

    it("should return correct index for peak at start", () => {
      const data = new Uint8Array([255, 100, 50, 25]);
      expect(getPeakFrequencyIndex(data)).toBe(0);
    });

    it("should return correct index for peak in middle", () => {
      const data = new Uint8Array([50, 100, 255, 100, 50]);
      expect(getPeakFrequencyIndex(data)).toBe(2);
    });

    it("should return correct index for peak at end", () => {
      const data = new Uint8Array([25, 50, 100, 255]);
      expect(getPeakFrequencyIndex(data)).toBe(3);
    });
  });

  describe("getBassEnergy", () => {
    it("should calculate energy from first 10% of frequencies", () => {
      // 10 elements, bass range = first 1 element
      const data = new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      const result = getBassEnergy(data);
      expect(result).toBe(1); // 255/255
    });

    it("should return 0 for silent bass", () => {
      const data = new Uint8Array([0, 255, 255, 255, 255, 255, 255, 255, 255, 255]);
      const result = getBassEnergy(data);
      expect(result).toBe(0);
    });
  });

  describe("getTrebleEnergy", () => {
    it("should calculate energy from last 30% of frequencies", () => {
      // 10 elements, treble range = last 3 elements (indices 7, 8, 9)
      const data = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 255, 255, 255]);
      const result = getTrebleEnergy(data);
      expect(result).toBe(1); // Average of 255s normalized
    });

    it("should return 0 for silent treble", () => {
      const data = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 0, 0, 0]);
      const result = getTrebleEnergy(data);
      expect(result).toBe(0);
    });
  });

  describe("lerp", () => {
    it("should return start value at t=0", () => {
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it("should return end value at t=1", () => {
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it("should return midpoint at t=0.5", () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it("should work with negative values", () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
    });

    it("should extrapolate beyond 0-1 range", () => {
      expect(lerp(0, 100, 2)).toBe(200);
      expect(lerp(0, 100, -1)).toBe(-100);
    });
  });

  describe("getLogarithmicIndex", () => {
    it("should return 0 for first bar", () => {
      const result = getLogarithmicIndex(0, 64, 1024);
      expect(result).toBe(0);
    });

    it("should return values within data bounds", () => {
      const dataLength = 1024;
      for (let i = 0; i < 64; i++) {
        const result = getLogarithmicIndex(i, 64, dataLength);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(dataLength);
      }
    });

    it("should have logarithmic distribution (higher indices have larger gaps)", () => {
      const index1 = getLogarithmicIndex(10, 64, 1024);
      const index2 = getLogarithmicIndex(20, 64, 1024);
      const index3 = getLogarithmicIndex(30, 64, 1024);

      const gap1 = index2 - index1;
      const gap2 = index3 - index2;

      // Later gaps should be larger due to logarithmic scaling
      expect(gap2).toBeGreaterThan(gap1);
    });
  });
});
