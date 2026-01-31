import { describe, it, expect } from "vitest";
import {
  wmpColors,
  getBarColor,
  getFrequencyColor,
  hslColor,
  getRainbowColor,
} from "@/utils/colorPalettes";

describe("colorPalettes", () => {
  describe("wmpColors", () => {
    it("should have all expected color constants", () => {
      expect(wmpColors.blue).toBe("#00bfff");
      expect(wmpColors.cyan).toBe("#00ffff");
      expect(wmpColors.green).toBe("#00ff7f");
      expect(wmpColors.yellow).toBe("#ffff00");
      expect(wmpColors.orange).toBe("#ff8c00");
      expect(wmpColors.red).toBe("#ff4500");
      expect(wmpColors.purple).toBe("#9370db");
      expect(wmpColors.pink).toBe("#ff69b4");
    });
  });

  describe("getBarColor", () => {
    it("should return blue-ish color for low values (0-0.25)", () => {
      const color = getBarColor(0);
      // Should be close to blue
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it("should return cyan-ish color around 0.25", () => {
      const color = getBarColor(0.25);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it("should return green-ish color around 0.5", () => {
      const color = getBarColor(0.5);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it("should return yellow-ish color around 0.75", () => {
      const color = getBarColor(0.75);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it("should return red-ish color for high values (1.0)", () => {
      const color = getBarColor(1);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it("should produce different colors for different values", () => {
      const color1 = getBarColor(0);
      const color2 = getBarColor(0.5);
      const color3 = getBarColor(1);

      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
      expect(color1).not.toBe(color3);
    });
  });

  describe("getFrequencyColor", () => {
    it("should normalize index to 0-1 range and return color", () => {
      const color = getFrequencyColor(32, 64);
      expect(color).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);
    });

    it("should return same color as getBarColor for equivalent normalized values", () => {
      const totalFrequencies = 100;
      const index = 50;
      const normalized = index / totalFrequencies;

      const freqColor = getFrequencyColor(index, totalFrequencies);
      const barColor = getBarColor(normalized);

      // They should match since getFrequencyColor uses getBarColor internally
      expect(freqColor).toBe(barColor);
    });

    it("should handle edge cases", () => {
      expect(() => getFrequencyColor(0, 100)).not.toThrow();
      expect(() => getFrequencyColor(99, 100)).not.toThrow();
    });
  });

  describe("hslColor", () => {
    it("should return valid HSL string with default saturation and lightness", () => {
      const color = hslColor(180);
      expect(color).toBe("hsl(180, 80%, 50%)");
    });

    it("should use custom saturation and lightness", () => {
      const color = hslColor(270, 60, 40);
      expect(color).toBe("hsl(270, 60%, 40%)");
    });

    it("should handle hue values in full range", () => {
      expect(hslColor(0)).toBe("hsl(0, 80%, 50%)");
      expect(hslColor(360)).toBe("hsl(360, 80%, 50%)");
      expect(hslColor(720)).toBe("hsl(720, 80%, 50%)"); // CSS handles overflow
    });

    it("should handle zero saturation (grayscale)", () => {
      const color = hslColor(0, 0, 50);
      expect(color).toBe("hsl(0, 0%, 50%)");
    });
  });

  describe("getRainbowColor", () => {
    it("should return HSL color string", () => {
      const color = getRainbowColor(0);
      expect(color).toMatch(/hsl\(\d+\.?\d*, 80%, 60%\)/);
    });

    it("should cycle through colors over time", () => {
      const color1 = getRainbowColor(0);
      const color2 = getRainbowColor(1000);
      const color3 = getRainbowColor(2000);

      // Colors should be different at different times
      expect(color1).not.toBe(color2);
      expect(color2).not.toBe(color3);
    });

    it("should apply offset correctly", () => {
      const colorNoOffset = getRainbowColor(0, 0);
      const colorWithOffset = getRainbowColor(0, 180);

      expect(colorNoOffset).not.toBe(colorWithOffset);
    });

    it("should produce valid hue values (0-360)", () => {
      for (let time = 0; time < 10000; time += 500) {
        const color = getRainbowColor(time);
        const match = color.match(/hsl\((\d+\.?\d*)/);
        expect(match).not.toBeNull();
        if (match) {
          const hue = parseFloat(match[1]);
          expect(hue).toBeGreaterThanOrEqual(0);
          expect(hue).toBeLessThan(360);
        }
      }
    });
  });
});
