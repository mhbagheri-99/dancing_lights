// WMP-inspired color palettes

export const wmpColors = {
  blue: "#00bfff",
  cyan: "#00ffff",
  green: "#00ff7f",
  yellow: "#ffff00",
  orange: "#ff8c00",
  red: "#ff4500",
  purple: "#9370db",
  pink: "#ff69b4",
};

// Gradient stops for bars visualizer (blue -> green -> yellow -> red)
export function getBarColor(normalized: number): string {
  if (normalized < 0.25) {
    // Blue to Cyan
    const t = normalized / 0.25;
    return interpolateColor(wmpColors.blue, wmpColors.cyan, t);
  } else if (normalized < 0.5) {
    // Cyan to Green
    const t = (normalized - 0.25) / 0.25;
    return interpolateColor(wmpColors.cyan, wmpColors.green, t);
  } else if (normalized < 0.75) {
    // Green to Yellow
    const t = (normalized - 0.5) / 0.25;
    return interpolateColor(wmpColors.green, wmpColors.yellow, t);
  } else {
    // Yellow to Red
    const t = (normalized - 0.75) / 0.25;
    return interpolateColor(wmpColors.yellow, wmpColors.red, t);
  }
}

// Get color based on frequency position (low = blue, high = red)
export function getFrequencyColor(
  frequencyIndex: number,
  totalFrequencies: number
): string {
  const normalized = frequencyIndex / totalFrequencies;
  return getBarColor(normalized);
}

// HSL-based coloring for smooth gradients
export function hslColor(
  hue: number,
  saturation: number = 80,
  lightness: number = 50
): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

// Rainbow cycling for ambiance mode
export function getRainbowColor(time: number, offset: number = 0): string {
  const hue = ((time * 0.05 + offset) % 360 + 360) % 360;
  return hslColor(hue, 80, 60);
}
