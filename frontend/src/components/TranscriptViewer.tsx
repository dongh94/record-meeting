import React, { useState } from "react";
import styled from "@emotion/styled";
import {
  FileText,
  Users,
  CheckSquare,
  Lightbulb,
  Download,
  Copy,
  Upload,
} from "lucide-react";
import { Transcript } from "../hooks/useTranscription";
import { useConfluence } from "../hooks/useConfluence";
import { formatKoreanDate, getRelativeTime } from "../utils/dateUtils";
import ConfluenceUploadModal from "./ConfluenceUploadModal";

const Container = styled.div`
  max-width: 100%;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 1.1rem;
  color: #666;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
  color: #666;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
`;

const TranscriptContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const Metadata = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;

  &:hover {
    background: #f8f9fa;
    border-color: #667eea;
    color: #667eea;
  }
`;

const Section = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-weight: 600;
  color: #333;
`;

const SectionContent = styled.div`
  line-height: 1.6;
  color: #555;
`;

const ContentText = styled.div`
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 1rem;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
  line-height: 1.5;
`;

const ParticipantTag = styled.span`
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin: 2px 4px 2px 0;
`;

const ErrorMessage = styled.div`
  background: #ffe6e6;
  color: #d63031;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #d63031;
  text-align: center;
`;

interface TranscriptViewerProps {
  transcript: Transcript | null;
  isLoading: boolean;
  error: string | null;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  isLoading,
  error,
}) => {
  const confluence = useConfluence();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCopy = async () => {
    if (!transcript) return;

    const text = `${transcript.title}\n\n${transcript.content}`;
    try {
      await navigator.clipboard.writeText(text);
      // TODO: 성공 토스트 메시지 표시
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleDownload = () => {
    if (!transcript) return;

    const content = `# ${transcript.title}

생성일: ${formatKoreanDate(transcript.createdAt)}

## 참석자
${transcript.participants.map((p) => `- ${p}`).join("\n")}

## 회의 내용
${transcript.content}

## 주요 포인트
${transcript.keyPoints.map((point) => `- ${point}`).join("\n")}

## 액션 아이템
${transcript.actionItems.map((item) => `- ${item}`).join("\n")}
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${transcript.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConfluenceUpload = () => {
    if (!transcript) return;
    setIsModalOpen(true);
  };

  const handleModalSuccess = (pageUrl: string) => {
    // 성공 시 새 탭에서 Confluence 페이지 열기
    window.open(pageUrl, "_blank");
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>
          AI가 음성을 분석하고 회의록을 생성하고 있습니다...
          <br />
          잠시만 기다려주세요.
        </LoadingText>
      </LoadingContainer>
    );
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  if (confluence.error) {
    return <ErrorMessage>{confluence.error}</ErrorMessage>;
  }

  if (!transcript) {
    return (
      <EmptyState>
        <EmptyIcon>
          <FileText size={32} />
        </EmptyIcon>
        <div>
          <h3>아직 생성된 회의록이 없습니다</h3>
          <p>음성을 녹음하고 AI 회의록 생성 버튼을 눌러보세요</p>
        </div>
      </EmptyState>
    );
  }

  return (
    <Container>
      <TranscriptContainer>
        <Header>
          <TitleSection>
            <Title>{transcript.title}</Title>
            <Metadata>
              생성일: {formatKoreanDate(transcript.createdAt)} (
              {getRelativeTime(transcript.createdAt)})
            </Metadata>
          </TitleSection>
          <Actions>
            <ActionButton onClick={handleCopy}>
              <Copy size={16} />
              복사
            </ActionButton>
            <ActionButton onClick={handleDownload}>
              <Download size={16} />
              다운로드
            </ActionButton>
            <ActionButton onClick={handleConfluenceUpload}>
              <Upload size={16} />
              Confluence
            </ActionButton>
          </Actions>
        </Header>

        <Section>
          <SectionHeader>
            <Users size={20} />
            참석자
          </SectionHeader>
          <SectionContent>
            {transcript.participants.map((participant, index) => (
              <ParticipantTag key={index}>{participant}</ParticipantTag>
            ))}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <FileText size={20} />
            회의 내용
          </SectionHeader>
          <SectionContent>
            <ContentText>{transcript.content}</ContentText>
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <Lightbulb size={20} />
            주요 포인트
          </SectionHeader>
          <SectionContent>
            <List>
              {transcript.keyPoints.map((point, index) => (
                <ListItem key={index}>{point}</ListItem>
              ))}
            </List>
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <CheckSquare size={20} />
            액션 아이템
          </SectionHeader>
          <SectionContent>
            <List>
              {transcript.actionItems.map((item, index) => (
                <ListItem key={index}>{item}</ListItem>
              ))}
            </List>
          </SectionContent>
        </Section>
      </TranscriptContainer>

      <ConfluenceUploadModal
        isOpen={isModalOpen}
        transcript={transcript}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </Container>
  );
};

export default TranscriptViewer;
