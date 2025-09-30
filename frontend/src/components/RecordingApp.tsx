import React, { useState } from "react";
import styled from "@emotion/styled";
import { Mic, FileText } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import TranscriptViewer from "./TranscriptViewer";
import { useRecording } from "../hooks/useRecording";
import { useTranscription } from "../hooks/useTranscription";

const Container = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  width: 100%;
  min-height: 600px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 30px;
`;

const TabContainer = styled.div`
  display: flex;
  border-radius: 12px;
  background: #f8f9fa;
  padding: 4px;
  margin-bottom: 30px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: ${(props) => (props.active ? "#fff" : "transparent")};
  color: ${(props) => (props.active ? "#333" : "#666")};
  font-weight: ${(props) => (props.active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: ${(props) =>
    props.active ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none"};

  &:hover {
    background: ${(props) => (props.active ? "#fff" : "#f0f0f0")};
  }
`;

const ContentArea = styled.div`
  min-height: 400px;
`;

type TabType = "record" | "transcript";

const RecordingApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("record");
  const recording = useRecording();
  const transcription = useTranscription();

  const handleTranscribe = async () => {
    if (recording.audioBlob) {
      await transcription.transcribeAudio(recording.audioBlob);
      setActiveTab("transcript");
    }
  };

  return (
    <Container>
      <Header>
        <Title>AI 회의록 생성기</Title>
        <Subtitle>
          음성을 녹음하고 AI가 자동으로 회의록을 생성해드립니다
        </Subtitle>
      </Header>

      <TabContainer>
        <Tab
          active={activeTab === "record"}
          onClick={() => setActiveTab("record")}
        >
          <Mic size={18} />
          녹음하기
        </Tab>
        <Tab
          active={activeTab === "transcript"}
          onClick={() => setActiveTab("transcript")}
        >
          <FileText size={18} />
          회의록 보기
        </Tab>
      </TabContainer>

      <ContentArea>
        {activeTab === "record" && (
          <AudioRecorder
            {...recording}
            onTranscribe={handleTranscribe}
            isTranscribing={transcription.isLoading}
          />
        )}
        {activeTab === "transcript" && (
          <TranscriptViewer
            transcript={transcription.transcript}
            isLoading={transcription.isLoading}
            error={transcription.error}
          />
        )}
      </ContentArea>
    </Container>
  );
};

export default RecordingApp;
