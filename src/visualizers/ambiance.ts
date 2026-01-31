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
    // Fireflies spawn randomly across entire screen
    x: Math.random() * width,
    y: Math.random() * height,
    // Random slow drift in any direction like real fireflies
    vx: (Math.random() - 0.5) * config.flowSpeed * 0.8,
    vy: (Math.random() - 0.5) * config.flowSpeed * 0.8,
    size: baseSize,
    baseSize: baseSize,
    hue: FIREFLY_HUES.min + Math.random() * (FIREFLY_HUES.max - FIREFLY_HUES.min),
    life: 0,
    maxLife: 1500 + Math.random() * 800,  // Long life for slow dreamy drift across screen
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

      // Reset particle if life expires - respawn randomly on screen
      if (particle.life > particle.maxLife) {
        const newParticle = createParticle(width, height, ambianceConfig);
        particles[index] = newParticle;
        return;
      }

      // Wrap around screen edges so fireflies stay visible
      if (particle.x < -30) particle.x = width + 20;
      if (particle.x > width + 30) particle.x = -20;
      if (particle.y < -30) particle.y = height + 20;
      if (particle.y > height + 30) particle.y = -20;

      // React to bass - expand size and add vertical movement
      const bassReaction = bassEnergy * reactivity;
      particle.size = particle.baseSize * (1 + bassReaction * 3);

      // React to treble - subtle shimmer
      const trebleReaction = trebleEnergy * reactivity;
      const speedMultiplier = 1 + trebleReaction * 0.5;

      // Slow dreamy drift with gentle wandering
      const wanderAngle = Math.sin(time * 0.0005 + particle.y * 0.005) * 0.3;
      particle.x += particle.vx * speedMultiplier * (deltaTime * 0.03);
      particle.y += particle.vy * speedMultiplier * (deltaTime * 0.03) + Math.sin(wanderAngle) * bassReaction * 0.8;

      // Gentle floating motion like real fireflies
      particle.y += Math.sin(time * 0.001 + particle.x * 0.005) * 0.3;
      particle.x += Math.cos(time * 0.0008 + particle.y * 0.003) * 0.2;

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
    particleCount: 60,
    maxSize: 35,
    minSize: 8,
    flowSpeed: 1.2,  // Slow dreamy drift
    reactivity: 1.5,
  } as AmbianceConfig,
};
