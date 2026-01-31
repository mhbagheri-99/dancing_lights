import type { VisualizerRenderer, AnalyserData, VisualizerConfig } from "./types";
import { getRainbowColor } from "@/utils/colorPalettes";
import { getBassEnergy, getTrebleEnergy } from "@/utils/audioHelpers";

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
    hue: Math.random() * 360,
    life: 0,
    maxLife: 800 + Math.random() * 400,  // Much longer life to cross full screen
  };
}

export const ambianceVisualizer: VisualizerRenderer = {
  name: "Ambiance",
  description: "Flowing particles that react to bass frequencies",

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

    // Clear with heavy fade for smooth trails
    ctx.fillStyle = "rgba(10, 10, 15, 0.05)";
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

      // Update hue based on audio
      particle.hue = (particle.hue + averageFrequency * 2) % 360;

      // Draw particle with glow
      const color = getRainbowColor(time + particle.hue, particle.hue);

      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = particle.size * 2 * (1 + bassEnergy);

      // Create gradient for soft particle
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size
      );
      gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${alpha * 0.8})`);
      gradient.addColorStop(0.5, `hsla(${particle.hue}, 70%, 50%, ${alpha * 0.4})`);
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw inner bright core
      if (alpha > 0.5) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0;

    // Draw ambient background gradient based on audio
    const bgGradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    const bgHue = (time * 0.01 + averageFrequency * 180) % 360;
    bgGradient.addColorStop(0, `hsla(${bgHue}, 50%, 20%, ${averageFrequency * 0.1})`);
    bgGradient.addColorStop(0.5, `hsla(${(bgHue + 60) % 360}, 40%, 10%, ${averageFrequency * 0.05})`);
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
