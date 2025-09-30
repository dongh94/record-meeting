import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecording } from "../hooks/useRecording";

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ondataavailable: null,
  onstop: null,
  state: "inactive",
};

const mockStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
};

// Mock navigator.mediaDevices
Object.defineProperty(navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue(mockStream),
  },
});

// Mock MediaRecorder constructor
global.MediaRecorder = vi
  .fn()
  .mockImplementation(() => mockMediaRecorder) as any;
(global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

// Mock URL methods
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn().mockReturnValue("blob:mock-url"),
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

describe("useRecording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("초기 상태가 올바르게 설정된다", () => {
    const { result } = renderHook(() => useRecording());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.audioBlob).toBe(null);
    expect(result.current.audioUrl).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("녹음을 시작할 수 있다", async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });
    expect(MediaRecorder).toHaveBeenCalledWith(mockStream, {
      mimeType: "audio/webm;codecs=opus",
    });
    expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
    expect(result.current.isRecording).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it("녹음 시간이 올바르게 증가한다", async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      vi.advanceTimersByTime(3000); // 3초 경과
    });

    expect(result.current.duration).toBe(3);
  });

  it("녹음을 중지할 수 있다", async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it("녹음을 일시정지할 수 있다", async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.pauseRecording();
    });

    expect(mockMediaRecorder.pause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);
  });

  it("일시정지된 녹음을 재개할 수 있다", async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.pauseRecording();
    });

    act(() => {
      result.current.resumeRecording();
    });

    expect(mockMediaRecorder.resume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);
  });

  it("녹음을 삭제할 수 있다", async () => {
    const { result } = renderHook(() => useRecording());

    // 먼저 녹음을 만들어야 함
    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    // onstop 이벤트 시뮬레이션
    act(() => {
      if (mockMediaRecorder.onstop) {
        (mockMediaRecorder.onstop as any)(new Event("stop"));
      }
    });

    act(() => {
      result.current.clearRecording();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(result.current.audioBlob).toBe(null);
    expect(result.current.audioUrl).toBe(null);
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it("마이크 접근 권한이 거부되면 에러가 설정된다", async () => {
    const mockError = new Error("Permission denied");
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      mockError
    );

    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toBe(
      "마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요."
    );
    expect(result.current.isRecording).toBe(false);
  });
});
