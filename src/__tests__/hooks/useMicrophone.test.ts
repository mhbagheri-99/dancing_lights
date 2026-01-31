import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMicrophone } from "@/hooks/useMicrophone";

describe("useMicrophone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default behavior
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockResolvedValue(new MediaStream());
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useMicrophone());

    expect(result.current.stream).toBeNull();
    expect(result.current.isActive).toBe(false);
    expect(result.current.isRequesting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should request microphone successfully", async () => {
    const { result } = renderHook(() => useMicrophone());

    await act(async () => {
      await result.current.requestMicrophone();
    });

    expect(result.current.stream).not.toBeNull();
    expect(result.current.isActive).toBe(true);
    expect(result.current.permissionState).toBe("granted");
    expect(result.current.error).toBeNull();
  });

  it("should handle NotAllowedError", async () => {
    const { result } = renderHook(() => useMicrophone());

    const error = new Error("Permission denied");
    error.name = "NotAllowedError";

    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValueOnce(error);

    await act(async () => {
      await result.current.requestMicrophone();
    });

    expect(result.current.stream).toBeNull();
    expect(result.current.isActive).toBe(false);
    expect(result.current.permissionState).toBe("denied");
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe("NotAllowedError");
  });

  it("should handle NotFoundError", async () => {
    const { result } = renderHook(() => useMicrophone());

    const error = new Error("No microphone");
    error.name = "NotFoundError";

    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValueOnce(error);

    await act(async () => {
      await result.current.requestMicrophone();
    });

    expect(result.current.error?.type).toBe("NotFoundError");
    expect(result.current.error?.message).toContain("No microphone");
  });

  it("should handle NotReadableError", async () => {
    const { result } = renderHook(() => useMicrophone());

    const error = new Error("Device in use");
    error.name = "NotReadableError";

    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValueOnce(error);

    await act(async () => {
      await result.current.requestMicrophone();
    });

    expect(result.current.error?.type).toBe("NotReadableError");
  });

  it("should handle SecurityError", async () => {
    const { result } = renderHook(() => useMicrophone());

    const error = new Error("Not HTTPS");
    error.name = "SecurityError";

    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValueOnce(error);

    await act(async () => {
      await result.current.requestMicrophone();
    });

    expect(result.current.error?.type).toBe("SecurityError");
  });

  it("should stop microphone and cleanup", async () => {
    const { result } = renderHook(() => useMicrophone());

    await act(async () => {
      await result.current.requestMicrophone();
    });

    // Verify we have an active stream
    expect(result.current.isActive).toBe(true);
    expect(result.current.stream).not.toBeNull();

    act(() => {
      result.current.stopMicrophone();
    });

    expect(result.current.stream).toBeNull();
    expect(result.current.isActive).toBe(false);
  });

  it("should return existing stream if already active", async () => {
    const { result } = renderHook(() => useMicrophone());

    await act(async () => {
      await result.current.requestMicrophone();
    });

    const stream1 = result.current.stream;
    expect(stream1).not.toBeNull();

    await act(async () => {
      await result.current.requestMicrophone();
    });

    // Stream should be the same (not re-requested)
    expect(result.current.stream).toBe(stream1);
  });

  it("should set isRequesting to true during request", async () => {
    const { result } = renderHook(() => useMicrophone());

    // Create a promise that we can control
    let resolveRequest: (value: MediaStream) => void;
    const pendingRequest = new Promise<MediaStream>((resolve) => {
      resolveRequest = resolve;
    });

    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockReturnValue(pendingRequest);

    // Start request but don't await
    act(() => {
      result.current.requestMicrophone();
    });

    // Should be requesting now
    expect(result.current.isRequesting).toBe(true);

    // Resolve the request
    await act(async () => {
      resolveRequest!(new MediaStream());
    });

    expect(result.current.isRequesting).toBe(false);
  });
});
