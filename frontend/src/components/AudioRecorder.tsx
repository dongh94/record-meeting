import React from "react";
import styled from "@emotion/styled";
import { Mic, Square, Pause, Play, Trash2, Sparkles } from "lucide-react";
import { UseRecordingReturn } from "../hooks/useRecording";
import { formatDuration } from "../utils/mockAI";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
`;

const RecordingStatus = styled.div<{ isRecording: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  border-radius: 20px;
  background: ${(props) =>
    props.isRecording
      ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
      : "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)"};
  color: white;
  min-width: 300px;
  transition: all 0.3s ease;
`;

const StatusIcon = styled.div<{ isRecording: boolean; isPaused: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${(props) =>
    props.isRecording && !props.isPaused ? "pulse 2s infinite" : "none"};

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const Duration = styled.div`
  font-size: 2rem;
  font-weight: 700;
  font-family: "Courier New", monospace;
`;

const StatusText = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" | "danger" }>`
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          &:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); }
        `;
      case "danger":
        return `
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          &:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3); }
        `;
      default:
        return `
          background: #f8f9fa;
          color: #333;
          border: 2px solid #e9ecef;
          &:hover { background: #e9ecef; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const AudioPlayer = styled.audio`
  width: 100%;
  max-width: 400px;
  margin: 20px 0;
`;

const ErrorMessage = styled.div`
  background: #ffe6e6;
  color: #d63031;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #d63031;
  margin: 20px 0;
  font-weight: 500;
`;

interface AudioRecorderProps extends UseRecordingReturn {
  onTranscribe: () => void;
  isTranscribing: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isRecording,
  isPaused,
  duration,
  audioBlob,
  audioUrl,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  clearRecording,
  error,
  onTranscribe,
  isTranscribing,
}) => {
  const getStatusText = () => {
    if (isRecording && isPaused) return "녹음 일시정지";
    if (isRecording) return "녹음 중...";
    if (audioBlob) return "녹음 완료";
    return "녹음 대기";
  };

  const getStatusIcon = () => {
    if (isRecording && isPaused) return <Pause size={32} />;
    if (isRecording) return <Mic size={32} />;
    return <Mic size={32} />;
  };

  return (
    <Container>
      <RecordingStatus isRecording={isRecording && !isPaused}>
        <StatusIcon isRecording={isRecording} isPaused={isPaused}>
          {getStatusIcon()}
        </StatusIcon>
        <Duration>{formatDuration(duration)}</Duration>
        <StatusText>{getStatusText()}</StatusText>
      </RecordingStatus>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Controls>
        {!isRecording && !audioBlob && (
          <Button variant="primary" onClick={startRecording}>
            <Mic size={18} />
            녹음 시작
          </Button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <Button variant="primary" onClick={resumeRecording}>
                <Play size={18} />
                재개
              </Button>
            ) : (
              <Button onClick={pauseRecording}>
                <Pause size={18} />
                일시정지
              </Button>
            )}
            <Button variant="danger" onClick={stopRecording}>
              <Square size={18} />
              중지
            </Button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <Button variant="primary" onClick={startRecording}>
              <Mic size={18} />
              다시 녹음
            </Button>
            <Button onClick={clearRecording}>
              <Trash2 size={18} />
              삭제
            </Button>
          </>
        )}
      </Controls>

      {audioUrl && (
        <>
          <AudioPlayer controls src={audioUrl} />
          <Button
            variant="primary"
            onClick={onTranscribe}
            disabled={isTranscribing}
          >
            <Sparkles size={18} />
            {isTranscribing ? "AI 분석 중..." : "AI 회의록 생성"}
          </Button>
        </>
      )}
    </Container>
  );
};

export default AudioRecorder;

