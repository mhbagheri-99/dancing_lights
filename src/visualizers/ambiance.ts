import type { VisualizerRenderer, AnalyserData, VisualizerConfig } from "./types";
import { getBassEnergy, getTrebleEnergy } from "@/utils/audioHelpers";

// Firefly color palette - warm yellow-green bioluminescent colors
const FIREFLY_HUES = {
  min: 45,   // Warm yellow
  max: 95,   // Yellow-green
};

interface AmbianceConfig extends VisualizerConfig {
  particleCount: number;
  maxSize: number;
  minSize: number;
  flowSpeed: number;
  reactivity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  hue: number;
  life: number;
  maxLife: number;
}

let particles: Particle[] = [];
let time = 0;
let initialized = false;

function initParticles(width: number, height: number, count: number, config: AmbianceConfig) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(width, height, config, true));
  }
  initialized = true;
}

function createParticle(
  width: number,
  height: number,
  config: AmbianceConfig,
  randomPosition: boolean = false
): Particle {
  const baseSize = config.minSize + Math.random() * (config.maxSize - config.minSize);
  return {
    // Initial particles spread across screen, respawns start off-screen left
    x: randomPosition ? Math.random() * width : -50 - Math.random() * 100,
    y: Math.random() * height,
    // Faster horizontal flow for full screen coverage
    vx: (1.2 + Math.random() * 0.8) * config.flowSpeed,
    vy: (Math.random() - 0.5) * config.flowSpeed * 0.3,
    size: baseSize,
    baseSize: baseSize,
    hue: FIREFLY_HUES.min + Math.random() * (FIREFLY_HUES.max - FIREFLY_HUES.min),
    life: 0,
    maxLife: 800 + Math.random() * 400,  // Much longer life to cross full screen
  };
}

export const ambianceVisualizer: VisualizerRenderer = {
  name: "Fireflies",
  description: "Glowing fireflies drifting through a forest night",

  render(
    ctx: CanvasRenderingContext2D,
    data: AnalyserData,
    config: VisualizerConfig,
    { width, height }: { width: number; height: number },
    deltaTime: number
  ) {
    const { frequencyData, averageFrequency } = data;
    const ambianceConfig = config as AmbianceConfig;
    const { particleCount, reactivity } = ambianceConfig;

    // Initialize particles if needed
    if (!initialized || particles.length !== particleCount) {
      initParticles(width, height, particleCount, ambianceConfig);
    }

    // Clear with heavy fade for smooth firefly trails - dark forest night
    ctx.fillStyle = "rgba(5, 10, 8, 0.06)";
    ctx.fillRect(0, 0, width, height);

    time += deltaTime;

    // Get bass and treble energy
    const bassEnergy = frequencyData.length > 0 ? getBassEnergy(frequencyData) : 0;
    const trebleEnergy = frequencyData.length > 0 ? getTrebleEnergy(frequencyData) : 0;

    // Update and draw particles
    particles.forEach((particle, index) => {
      // Update life
      particle.life++;

      // Reset particle if it goes off screen or life expires
      if (
        particle.x > width + 50 ||
        particle.y < -50 ||
        particle.y > height + 50 ||
        particle.life > particle.maxLife
      ) {
        const newParticle = createParticle(width, height, ambianceConfig);
        particles[index] = newParticle;
        return;
      }

      // React to bass - expand size and add vertical movement
      const bassReaction = bassEnergy * reactivity;
      particle.size = particle.baseSize * (1 + bassReaction * 3);

      // React to treble - add shimmer and speed variation
      const trebleReaction = trebleEnergy * reactivity;
      const speedMultiplier = 1 + trebleReaction * 2;

      // Update position with flow and audio reaction
      const flowAngle = Math.sin(time * 0.001 + particle.y * 0.01) * 0.5;
      particle.x += particle.vx * speedMultiplier * (deltaTime * 0.05);
      particle.y += particle.vy * speedMultiplier * (deltaTime * 0.05) + Math.sin(flowAngle) * bassReaction * 2;

      // Add slight wave motion
      particle.y += Math.sin(time * 0.002 + particle.x * 0.01) * 0.5;

      // Calculate alpha based on life
      const lifeRatio = particle.life / particle.maxLife;
      const alpha = lifeRatio < 0.1
        ? lifeRatio * 10
        : lifeRatio > 0.8
          ? (1 - lifeRatio) * 5
          : 1;

      // Update hue - oscillate within firefly color range based on audio
      const hueRange = FIREFLY_HUES.max - FIREFLY_HUES.min;
      particle.hue = FIREFLY_HUES.min + ((particle.hue - FIREFLY_HUES.min + averageFrequency * 0.5) % hueRange);

      // Firefly glow color - warm yellow-green
      const glowColor = `hsl(${particle.hue}, 100%, 60%)`;

      // Outer glow - warm firefly glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = particle.size * 2.5 * (1 + bassEnergy);

      // Create gradient for soft firefly particle
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size
      );
      // Bright white-yellow core fading to warm green
      gradient.addColorStop(0, `hsla(60, 100%, 95%, ${alpha * 0.9})`);
      gradient.addColorStop(0.3, `hsla(${particle.hue}, 100%, 70%, ${alpha * 0.7})`);
      gradient.addColorStop(0.6, `hsla(${particle.hue}, 90%, 50%, ${alpha * 0.3})`);
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw inner bright core - white-yellow firefly center
      if (alpha > 0.5) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 220, ${alpha * 0.8})`;
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0;

    // Draw ambient background gradient - dark forest night atmosphere
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    // Dark blue-green forest night colors
    bgGradient.addColorStop(0, `hsla(180, 30%, 8%, ${0.05 + averageFrequency * 0.1})`);
    bgGradient.addColorStop(0.5, `hsla(200, 40%, 5%, ${averageFrequency * 0.05})`);
    bgGradient.addColorStop(1, "transparent");

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
  },

  defaultConfig: {
    particleCount: 80,
    maxSize: 40,
    minSize: 10,
    flowSpeed: 3.5,  // Fast flow to cross entire screen
    reactivity: 2,
  } as AmbianceConfig,
};
