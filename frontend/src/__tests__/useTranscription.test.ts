import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTranscription } from "../hooks/useTranscription";

// Mock the mockAI utility
vi.mock("../utils/mockAI", () => ({
  generateMockTranscript: vi.fn(() => ({
    id: "test-transcript-1",
    title: "테스트 회의",
    content: "테스트 회의 내용입니다.",
    summary: "테스트 요약입니다.",
    participants: ["참석자1", "참석자2"],
    keyPoints: ["포인트1", "포인트2"],
    actionItems: ["액션1", "액션2"],
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  })),
}));

describe("useTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("초기 상태가 올바르게 설정된다", () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.transcript).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("오디오를 전사할 수 있다", async () => {
    const { result } = renderHook(() => useTranscription());
    const audioBlob = new Blob(["test audio"], { type: "audio/webm" });

    act(() => {
      result.current.transcribeAudio(audioBlob);
    });

    // 로딩 상태 확인
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    // 3초 후 완료
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.transcript).toEqual({
      id: "test-transcript-1",
      title: "테스트 회의",
      content: "테스트 회의 내용입니다.",
      summary: "테스트 요약입니다.",
      participants: ["참석자1", "참석자2"],
      keyPoints: ["포인트1", "포인트2"],
      actionItems: ["액션1", "액션2"],
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });
  });

  it("전사를 삭제할 수 있다", async () => {
    const { result } = renderHook(() => useTranscription());
    const audioBlob = new Blob(["test audio"], { type: "audio/webm" });

    // 먼저 전사 생성
    await act(async () => {
      result.current.transcribeAudio(audioBlob);
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.transcript).not.toBe(null);

    // 전사 삭제
    act(() => {
      result.current.clearTranscript();
    });

    expect(result.current.transcript).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("전사 중 에러가 발생하면 에러 상태가 설정된다", async () => {
    // Mock에서 에러 발생하도록 설정
    const { generateMockTranscript } = await import("../utils/mockAI");
    (generateMockTranscript as any).mockImplementationOnce(() => {
      throw new Error("전사 실패");
    });

    const { result } = renderHook(() => useTranscription());
    const audioBlob = new Blob(["test audio"], { type: "audio/webm" });

    await act(async () => {
      result.current.transcribeAudio(audioBlob);
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(
      "음성 전사 중 오류가 발생했습니다. 다시 시도해주세요."
    );
    expect(result.current.transcript).toBe(null);
  });

  it("동시에 여러 전사 요청을 처리할 수 있다", async () => {
    const { result } = renderHook(() => useTranscription());
    const audioBlob1 = new Blob(["test audio 1"], { type: "audio/webm" });
    const audioBlob2 = new Blob(["test audio 2"], { type: "audio/webm" });

    // 첫 번째 전사 시작
    act(() => {
      result.current.transcribeAudio(audioBlob1);
    });

    expect(result.current.isLoading).toBe(true);

    // 두 번째 전사 시작 (첫 번째가 아직 진행 중)
    act(() => {
      result.current.transcribeAudio(audioBlob2);
    });

    // 여전히 로딩 중이어야 함
    expect(result.current.isLoading).toBe(true);

    // 시간 경과 후 완료
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.transcript).not.toBe(null);
  });
});
