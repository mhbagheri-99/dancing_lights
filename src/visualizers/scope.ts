import type { VisualizerRenderer, AnalyserData, VisualizerConfig } from "./types";

interface ScopeConfig extends VisualizerConfig {
  barCount: number;
  baseRadius: number;
  maxBarHeight: number;
  rotationSpeed: number;
  barWidth: number;
}

interface Triangle {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
  alpha: number;
}

let rotation = 0;
let time = 0;
let triangles: Triangle[] = [];
let initialized = false;
// Random offsets for each bar segment
let randomOffsets: number[] = [];
let lastOffsetUpdate = 0;

function initTriangles(width: number, height: number, count: number) {
  triangles = [];
  for (let i = 0; i < count; i++) {
    triangles.push(createTriangle(width, height));
  }
  initialized = true;
}

function createTriangle(width: number, height: number): Triangle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: 15 + Math.random() * 35,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    alpha: 0.1 + Math.random() * 0.25,
  };
}

function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(-size / 2, size / 2);
  ctx.lineTo(size / 2, size / 2);
  ctx.closePath();
  ctx.fillStyle = `rgba(180, 130, 255, ${alpha})`;
  ctx.fill();
  ctx.restore();
}

export const scopeVisualizer: VisualizerRenderer = {
  name: "Scope",
  description: "Circular equalizer with radial bars",

  render(
    ctx: CanvasRenderingContext2D,
    data: AnalyserData,
    config: VisualizerConfig,
    { width, height }: { width: number; height: number },
    deltaTime: number
  ) {
    const { frequencyData, averageFrequency } = data;
    const { barCount, baseRadius, maxBarHeight, rotationSpeed, barWidth } = config as ScopeConfig;

    // Initialize triangles if needed
    if (!initialized) {
      initTriangles(width, height, 25);
    }

    // Clear with purple radial gradient background
    const bgGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    bgGradient.addColorStop(0, `rgba(80, 40, 120, ${0.3 + averageFrequency * 0.2})`);
    bgGradient.addColorStop(0.5, "rgba(40, 20, 60, 0.2)");
    bgGradient.addColorStop(1, "rgba(10, 10, 15, 1)");

    ctx.fillStyle = "rgba(10, 10, 15, 0.25)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    time += deltaTime;
    rotation += rotationSpeed * deltaTime * 0.001 * (1 + averageFrequency);

    const centerX = width / 2;
    const centerY = height / 2;
    const minDimension = Math.min(width, height);
    const baseR = minDimension * baseRadius;
    const maxHeight = minDimension * maxBarHeight;

    // Update and draw triangles in background
    triangles.forEach((tri, index) => {
      tri.x += tri.vx + averageFrequency * tri.vx * 2;
      tri.y += tri.vy + averageFrequency * tri.vy * 2;
      tri.rotation += tri.rotationSpeed * (1 + averageFrequency * 2);

      // Wrap around screen
      if (tri.x < -50) tri.x = width + 50;
      if (tri.x > width + 50) tri.x = -50;
      if (tri.y < -50) tri.y = height + 50;
      if (tri.y > height + 50) tri.y = -50;

      drawTriangle(ctx, tri.x, tri.y, tri.size, tri.rotation, tri.alpha);
    });

    // Initialize random offsets if needed
    if (randomOffsets.length !== barCount) {
      randomOffsets = new Array(barCount).fill(0).map(() => Math.random());
    }

    // Update random offsets frequently for energetic movement
    const now = Date.now();
    if (now - lastOffsetUpdate > 30 + (1 - averageFrequency) * 50) {
      for (let i = 0; i < barCount; i++) {
        randomOffsets[i] += (Math.random() - 0.5) * 0.5;
        randomOffsets[i] = Math.max(0, Math.min(1, randomOffsets[i]));
      }
      lastOffsetUpdate = now;
    }

    // Draw the circular equalizer
    const angleStep = (Math.PI * 2) / barCount;

    for (let i = 0; i < barCount; i++) {
      const angle = i * angleStep + rotation;

      // Boost weak signals and add random variation for energetic movement
      const boostedFreq = Math.pow(averageFrequency, 0.5) * 1.5;  // Square root boost for weak signals
      const randomVariation = 0.4 + randomOffsets[i] * 1.4;  // 0.4 to 1.8 range
      const amplitude = Math.min(1, boostedFreq * randomVariation + 0.05);  // Floor of 0.05

      // Bar height based on amplitude
      const barHeight = amplitude * maxHeight;

      // Calculate bar positions - extends both inward and outward
      const innerRadius = baseR - barHeight * 0.3;
      const outerRadius = baseR + barHeight * 0.7;

      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      const x1 = centerX + cosAngle * innerRadius;
      const y1 = centerY + sinAngle * innerRadius;
      const x2 = centerX + cosAngle * outerRadius;
      const y2 = centerY + sinAngle * outerRadius;

      // Draw bar with glow
      const hue = 270 + amplitude * 30; // Purple to pink
      const lightness = 60 + amplitude * 20;

      ctx.shadowColor = `hsl(${hue}, 80%, ${lightness}%)`;
      ctx.shadowBlur = 8 + amplitude * 15;

      ctx.strokeStyle = `hsla(${hue}, 70%, ${lightness}%, ${0.7 + amplitude * 0.3})`;
      ctx.lineWidth = barWidth + amplitude * 2;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Bright core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 255, ${amplitude * 0.5})`;
      ctx.lineWidth = barWidth * 0.4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw base circle ring
    ctx.shadowColor = "rgba(180, 130, 255, 0.8)";
    ctx.shadowBlur = 15 + averageFrequency * 10;
    ctx.strokeStyle = `rgba(200, 170, 255, ${0.4 + averageFrequency * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow circle
    ctx.shadowBlur = 0;
    const innerGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseR * 0.8
    );
    innerGlow.addColorStop(0, `rgba(150, 100, 200, ${averageFrequency * 0.15})`);
    innerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseR * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  },

  defaultConfig: {
    barCount: 128,
    baseRadius: 0.22,
    maxBarHeight: 0.18,
    rotationSpeed: 0.15,
    barWidth: 2,
  } as ScopeConfig,
};
