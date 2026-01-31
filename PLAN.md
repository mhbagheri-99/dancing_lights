# Dancing Lights - Audio Visualizer Web App

## Overview
A Next.js webapp that accesses the user's microphone and displays Windows Media Player-inspired audio visualizations.

## Technology Stack
- **Next.js 16.1.6** with App Router and TypeScript
- **React 19.2.3**
- **Tailwind CSS 4** for dark theme styling
- **Web Audio API** for audio processing (no external audio libraries needed)
- **Canvas 2D** for rendering

## File Structure

```
dancing_lights/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with dark theme
│   │   ├── page.tsx            # Main page (Server Component)
│   │   └── globals.css         # Tailwind + WMP-inspired dark theme
│   │
│   ├── components/
│   │   ├── Visualizer.tsx      # Main client wrapper ("use client")
│   │   ├── VisualizerCanvas.tsx # Canvas rendering with resize handling
│   │   ├── ModeSelector.tsx    # Visualization mode switcher
│   │   ├── MicrophoneButton.tsx # Mic permission/toggle button
│   │   └── ControlPanel.tsx    # Optional settings panel
│   │
│   ├── hooks/
│   │   ├── useAudioContext.ts  # AudioContext lifecycle management
│   │   ├── useMicrophone.ts    # getUserMedia + error handling
│   │   ├── useAnalyser.ts      # AnalyserNode data extraction
│   │   ├── useAnimationFrame.ts # requestAnimationFrame hook
│   │   └── useVisualizerState.ts # Combined state management
│   │
│   ├── visualizers/
│   │   ├── types.ts            # Shared visualizer interfaces
│   │   ├── bars.ts             # Bars/Spectrum visualizer
│   │   ├── waveform.ts         # Oscilloscope visualizer
│   │   ├── scope.ts            # Circular/radial visualizer
│   │   ├── ambiance.ts         # Flowing particle visualizer
│   │   └── index.ts            # Visualizer registry
│   │
│   └── utils/
│       ├── audioHelpers.ts     # FFT processing, normalization
│       └── colorPalettes.ts    # WMP-inspired color schemes
│
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Visualizer Modes

### 1. Bars/Spectrum
Classic frequency bars showing the audio spectrum. Features:
- Gradient coloring (blue → green → yellow)
- Reflection effect below bars
- Logarithmic frequency distribution

### 2. Waveform/Oscilloscope
Real-time waveform display. Features:
- Green phosphor glow effect (CRT style)
- Centered around display middle
- Optional fill mode

### 3. Scope
Circular/radial visualization. Features:
- Points arranged in a circle
- Radius modulated by frequency amplitude
- Optional rotation synchronized to beat

### 4. Ambiance
Flowing, organic particle visualization. Features:
- Particles that react to bass frequencies
- Color shifting based on spectrum
- Trail effects for dreamy feel

## Audio Architecture

```
Microphone (getUserMedia)
    │
    ▼
MediaStreamSource
    │
    ▼
AnalyserNode (FFT processing)
    │
    ├── getByteFrequencyData()      → Bars, Scope, Ambiance
    └── getByteTimeDomainData()     → Waveform
    │
    ▼
Canvas Rendering (requestAnimationFrame)
```

## Key Implementation Details

### AudioContext Initialization
- Must be created after user interaction (browser policy)
- Handle suspended state with `audioContext.resume()`

### Microphone Error Handling
- `NotFoundError`: No microphone found
- `NotAllowedError`: Permission denied
- `NotReadableError`: Device in use
- `SecurityError`: Not HTTPS (required for production)

### Canvas Performance
- Use `devicePixelRatio` for crisp rendering on high-DPI displays
- Pre-allocate typed arrays outside render loop
- Use `requestAnimationFrame` (not `setInterval`)
- Cleanup on unmount to prevent memory leaks

## UI/UX Design

### Dark Theme (WMP Aesthetic)
- Near-black background (#0a0a0f)
- Cyan/blue accent colors
- Glow effects on interactive elements

### Layout
- Full-screen canvas
- Controls overlay at bottom (fade on hover)
- Mode selector as pill-style tabs

### Microphone Button States
1. Initial: "Click to enable microphone"
2. Requesting: Loading spinner
3. Active: Pulsing indicator
4. Denied: Error with instructions

## Implementation Phases

### Phase 1: Project Setup
1. Initialize Next.js 15 with `npx create-next-app@latest`
2. Configure Tailwind 4 with dark theme
3. Create folder structure

### Phase 2: Audio Hooks
1. `useAudioContext` - AudioContext lifecycle
2. `useMicrophone` - getUserMedia with error handling
3. `useAnalyser` - frequency/waveform data extraction
4. `useAnimationFrame` - render loop
5. `useVisualizerState` - combined state

### Phase 3: Components
1. `MicrophoneButton` with all states
2. `VisualizerCanvas` with responsive sizing
3. `ModeSelector` for switching visualizers
4. `Visualizer` wrapper component

### Phase 4: Visualizers
1. Bars visualizer (establishes pattern)
2. Waveform visualizer
3. Scope visualizer
4. Ambiance visualizer

### Phase 5: Polish
1. Smooth transitions between modes
2. Keyboard shortcuts (space = mic, 1-4 = modes)
3. Fullscreen support

## Verification

### Testing Locally
1. Run `npm run dev`
2. Open http://localhost:3000
3. Click microphone button to grant permission
4. Play music or speak into microphone
5. Switch between all 4 visualizer modes
6. Verify responsive canvas sizing by resizing window

### Cross-Browser Testing
- Chrome, Firefox, Safari, Edge
- Verify getUserMedia permission flow
- Test on both desktop and mobile

## Critical Files (in order of implementation)

1. `src/hooks/useAudioContext.ts`
2. `src/hooks/useMicrophone.ts`
3. `src/hooks/useVisualizerState.ts`
4. `src/components/VisualizerCanvas.tsx`
5. `src/visualizers/bars.ts`
