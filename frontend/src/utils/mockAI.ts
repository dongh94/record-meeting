import { Transcript } from "../hooks/useTranscription";

const mockMeetingData = [
  {
    title: "프로젝트 킥오프 회의",
    content: `안녕하세요, 여러분. 오늘은 새로운 프로젝트의 킥오프 회의를 진행하겠습니다.

먼저 프로젝트 개요부터 말씀드리겠습니다. 이번 프로젝트는 AI 기반 회의록 자동 생성 시스템을 개발하는 것입니다. 목표는 음성을 실시간으로 텍스트로 변환하고, 구조화된 회의록을 자동으로 생성하는 것입니다.

팀 구성은 다음과 같습니다. 김철수 님이 프로젝트 매니저를 맡아주시고, 이영희 님이 프론트엔드 개발을, 박민수 님이 백엔드 개발을 담당하겠습니다. 최지영 님은 AI 모델 개발을 맡아주시겠습니다.

일정은 총 3개월로 계획되어 있습니다. 첫 번째 달에는 기본 기능 개발, 두 번째 달에는 AI 모델 통합, 세 번째 달에는 테스트 및 배포를 진행할 예정입니다.

예산은 총 5천만원으로 책정되어 있으며, 주요 비용은 개발 인력비와 AI API 사용료입니다.

다음 회의는 다음 주 화요일 오후 2시에 진행하겠습니다. 그때까지 각자 담당 업무의 상세 계획을 준비해 주시기 바랍니다.`,
    participants: [
      "김철수 (PM)",
      "이영희 (Frontend)",
      "박민수 (Backend)",
      "최지영 (AI)",
    ],
    keyPoints: [
      "AI 기반 회의록 자동 생성 시스템 개발 프로젝트 시작",
      "총 개발 기간: 3개월",
      "예산: 5천만원",
      "팀 구성: PM 1명, 개발자 3명",
    ],
    actionItems: [
      "김철수: 프로젝트 상세 일정 수립 (마감: 12/30)",
      "이영희: 프론트엔드 기술 스택 조사 (마감: 12/28)",
      "박민수: 백엔드 아키텍처 설계 (마감: 12/28)",
      "최지영: AI 모델 후보 조사 및 성능 분석 (마감: 1/2)",
    ],
  },
  {
    title: "주간 진행 상황 점검",
    content: `안녕하세요. 이번 주 진행 상황을 점검해보겠습니다.

먼저 프론트엔드 개발 현황입니다. 이영희 님, 보고 부탁드립니다.
네, 이번 주에는 기본 UI 컴포넌트 개발을 완료했습니다. 녹음 인터페이스와 회의록 표시 화면을 구현했고, 반응형 디자인도 적용했습니다. 다음 주에는 실시간 음성 인식 기능을 연동할 예정입니다.

백엔드는 어떤가요? 박민수 님.
API 서버 기본 구조를 완성했습니다. 사용자 인증, 파일 업로드, 데이터베이스 연동까지 구현했습니다. 현재 AI 모델과의 연동 부분을 작업 중이고, 이번 주 내로 완료할 예정입니다.

AI 모델 개발 상황은 어떤가요? 최지영 님.
음성 인식 모델의 정확도를 90%까지 향상시켰습니다. 한국어 특화 학습을 진행했고, 회의 용어에 대한 인식률도 크게 개선되었습니다. 다음 주에는 실시간 처리 최적화를 진행할 예정입니다.

전체적으로 일정대로 잘 진행되고 있습니다. 다음 주까지 각 모듈 간 연동 테스트를 완료해 주시기 바랍니다.`,
    participants: [
      "김철수 (PM)",
      "이영희 (Frontend)",
      "박민수 (Backend)",
      "최지영 (AI)",
    ],
    keyPoints: [
      "프론트엔드: 기본 UI 컴포넌트 개발 완료",
      "백엔드: API 서버 기본 구조 완성",
      "AI: 음성 인식 정확도 90% 달성",
      "전체 진행률: 약 60%",
    ],
    actionItems: [
      "이영희: 실시간 음성 인식 기능 연동 (마감: 1/7)",
      "박민수: AI 모델 연동 API 개발 완료 (마감: 1/5)",
      "최지영: 실시간 처리 최적화 (마감: 1/7)",
      "전체: 모듈 간 연동 테스트 (마감: 1/7)",
    ],
  },
];

export const generateMockTranscript = (): Transcript => {
  const randomData =
    mockMeetingData[Math.floor(Math.random() * mockMeetingData.length)];

  return {
    id: `transcript-${Date.now()}`,
    title: randomData.title,
    content: randomData.content,
    summary: `${randomData.title}에 대한 회의가 진행되었습니다. 주요 안건들이 논의되었고, 구체적인 액션 아이템들이 도출되었습니다.`,
    participants: randomData.participants,
    keyPoints: randomData.keyPoints,
    actionItems: randomData.actionItems,
    createdAt: new Date().toISOString(),
  };
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
