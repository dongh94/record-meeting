import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AudioRecorder from "../components/AudioRecorder";
import { UseRecordingReturn } from "../hooks/useRecording";

// Mock props
const mockProps: UseRecordingReturn & {
  onTranscribe: () => void;
  isTranscribing: boolean;
} = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioBlob: null,
  audioUrl: null,
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  clearRecording: vi.fn(),
  error: null,
  onTranscribe: vi.fn(),
  isTranscribing: false,
};

describe("AudioRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("초기 상태에서 녹음 시작 버튼이 표시된다", () => {
    render(<AudioRecorder {...mockProps} />);

    expect(screen.getByText("녹음 시작")).toBeInTheDocument();
    expect(screen.getByText("녹음 대기")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("녹음 시작 버튼을 클릭하면 startRecording이 호출된다", () => {
    render(<AudioRecorder {...mockProps} />);

    const startButton = screen.getByText("녹음 시작");
    fireEvent.click(startButton);

    expect(mockProps.startRecording).toHaveBeenCalledTimes(1);
  });

  it("녹음 중일 때 일시정지와 중지 버튼이 표시된다", () => {
    render(<AudioRecorder {...mockProps} isRecording={true} />);

    expect(screen.getByText("일시정지")).toBeInTheDocument();
    expect(screen.getByText("중지")).toBeInTheDocument();
    expect(screen.getByText("녹음 중...")).toBeInTheDocument();
  });

  it("녹음이 일시정지된 상태에서 재개 버튼이 표시된다", () => {
    render(<AudioRecorder {...mockProps} isRecording={true} isPaused={true} />);

    expect(screen.getByText("재개")).toBeInTheDocument();
    expect(screen.getByText("중지")).toBeInTheDocument();
    expect(screen.getByText("녹음 일시정지")).toBeInTheDocument();
  });

  it("녹음 완료 후 오디오 플레이어와 AI 변환 버튼이 표시된다", () => {
    const audioBlob = new Blob(["test"], { type: "audio/webm" });
    const audioUrl = "blob:test-url";

    render(
      <AudioRecorder {...mockProps} audioBlob={audioBlob} audioUrl={audioUrl} />
    );

    expect(screen.getByText("AI 회의록 생성")).toBeInTheDocument();
    expect(screen.getByText("다시 녹음")).toBeInTheDocument();
    expect(screen.getByText("삭제")).toBeInTheDocument();
    // audio 요소가 DOM에 있는지 확인
    const audioElement = document.querySelector("audio");
    expect(audioElement).toBeInTheDocument();
  });

  it("AI 변환 중일 때 버튼 텍스트가 변경된다", () => {
    const audioBlob = new Blob(["test"], { type: "audio/webm" });

    render(
      <AudioRecorder
        {...mockProps}
        audioBlob={audioBlob}
        audioUrl="blob:test-url"
        isTranscribing={true}
      />
    );

    expect(screen.getByText("AI 분석 중...")).toBeInTheDocument();
    expect(screen.getByText("AI 분석 중...")).toBeDisabled();
  });

  it("에러가 있을 때 에러 메시지가 표시된다", () => {
    render(
      <AudioRecorder {...mockProps} error="마이크 접근 권한이 필요합니다." />
    );

    expect(
      screen.getByText("마이크 접근 권한이 필요합니다.")
    ).toBeInTheDocument();
  });

  it("시간이 올바르게 포맷팅된다", () => {
    render(<AudioRecorder {...mockProps} duration={125} />);

    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("AI 회의록 생성 버튼을 클릭하면 onTranscribe가 호출된다", () => {
    const audioBlob = new Blob(["test"], { type: "audio/webm" });

    render(
      <AudioRecorder
        {...mockProps}
        audioBlob={audioBlob}
        audioUrl="blob:test-url"
      />
    );

    const transcribeButton = screen.getByText("AI 회의록 생성");
    fireEvent.click(transcribeButton);

    expect(mockProps.onTranscribe).toHaveBeenCalledTimes(1);
  });
});
