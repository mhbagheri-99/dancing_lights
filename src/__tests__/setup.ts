import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock requestAnimationFrame and cancelAnimationFrame
let rafId = 0;
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafId++;
  setTimeout(() => callback(performance.now()), 16);
  return rafId;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock ResizeObserver
class MockResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock AudioContext
class MockAnalyserNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.8;
  minDecibels = -90;
  maxDecibels = -10;

  connect = vi.fn();
  disconnect = vi.fn();
  getByteFrequencyData = vi.fn((array: Uint8Array) => {
    // Fill with some test data
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  });
  getByteTimeDomainData = vi.fn((array: Uint8Array) => {
    // Fill with centered test data (128 = silence)
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.floor(Math.sin(i * 0.1) * 50);
    }
  });
}

class MockMediaStreamAudioSourceNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "running";

  createAnalyser = vi.fn(() => new MockAnalyserNode());
  createMediaStreamSource = vi.fn(() => new MockMediaStreamAudioSourceNode());
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

global.AudioContext = MockAudioContext as unknown as typeof AudioContext;
(global as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = MockAudioContext as unknown as typeof AudioContext;

// Mock MediaStream
class MockMediaStreamTrack {
  kind = "audio";
  enabled = true;
  stop = vi.fn();
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[] = [new MockMediaStreamTrack()];

  getTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return this.tracks;
  }
}

global.MediaStream = MockMediaStream as unknown as typeof MediaStream;

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn(() => Promise.resolve(new MockMediaStream()));

Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
  configurable: true,
});

// Mock navigator.permissions
const mockPermissionsQuery = vi.fn(() =>
  Promise.resolve({
    state: "prompt" as PermissionState,
    onchange: null,
  })
);

Object.defineProperty(global.navigator, "permissions", {
  value: {
    query: mockPermissionsQuery,
  },
  writable: true,
  configurable: true,
});

// Mock window.isSecureContext
Object.defineProperty(global.window, "isSecureContext", {
  value: true,
  writable: true,
});

// Mock Canvas 2D Context
function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    canvas: document.createElement("canvas"),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    shadowColor: "",
    shadowBlur: 0,
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    globalCompositeOperation: "source-over",

    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
}

// Patch HTMLCanvasElement.prototype.getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (contextId: string, options?: unknown) {
  if (contextId === "2d") {
    return createMockCanvasContext();
  }
  return originalGetContext.call(this, contextId, options);
} as typeof HTMLCanvasElement.prototype.getContext;

// Export mocks for test files to use
export {
  mockGetUserMedia,
  mockPermissionsQuery,
  MockAudioContext,
  MockAnalyserNode,
  MockMediaStream,
  createMockCanvasContext,
};
