import { useState, useCallback } from "react";
import { generateMockTranscript } from "../utils/mockAI";
import { getApiUrl, API_CONFIG } from "../config/api";

export interface Transcript {
  id: string;
  title: string;
  content: string;
  summary: string;
  participants: string[];
  keyPoints: string[];
  actionItems: string[];
  createdAt: string; // API에서 받는 데이터는 문자열 형태
}

export interface UseTranscriptionReturn {
  transcript: Transcript | null;
  isLoading: boolean;
  error: string | null;
  transcribeAudio: (audioBlob: Blob) => Promise<void>;
  clearTranscript: () => void;
}

export const useTranscription = (): UseTranscriptionReturn => {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsLoading(true);
    setError(null);

    try {
      // 오디오 데이터 정보 로깅
      console.log("🎵 오디오 데이터 정보:");
      console.log("- 파일 크기:", audioBlob.size, "bytes");
      console.log("- 파일 타입:", audioBlob.type);
      console.log("- 오디오 Blob 객체:", audioBlob);

      // FormData 생성하여 오디오 파일 전송
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      console.log("📤 FormData 전송 준비:");
      console.log("- 파일명: recording.webm");
      console.log("- FormData 객체:", formData);

      // FormData 내용 확인
      for (let [key, value] of formData.entries()) {
        console.log(`- ${key}:`, value);
      }

      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.TRANSCRIPTION_UPLOAD);
      console.log("🌐 API 요청 시작:", apiUrl);

      // 백엔드 API 호출
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("📥 API 응답 수신:");
      console.log("- 상태 코드:", response.status);
      console.log("- 상태 텍스트:", response.statusText);
      console.log(
        "- 응답 헤더:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        console.error("❌ HTTP 오류:", response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📋 응답 데이터:", result);

      if (!result.success) {
        console.error("❌ API 오류:", result.error);
        throw new Error(result.error || "회의록 생성에 실패했습니다.");
      }

      console.log("✅ 회의록 생성 성공:", result.transcript);
      setTranscript(result.transcript);
    } catch (err) {
      console.error("전사 실패:", err);

      let errorMessage = "음성 전사 중 오류가 발생했습니다.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      // HTTP 상태 코드별 메시지 개선
      if (errorMessage.includes("status: 500")) {
        errorMessage =
          "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      } else if (errorMessage.includes("status: 429")) {
        errorMessage =
          "API 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.";
      } else if (errorMessage.includes("status: 401")) {
        errorMessage = "인증에 실패했습니다. 설정을 확인해주세요.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript(null);
    setError(null);
  }, []);

  return {
    transcript,
    isLoading,
    error,
    transcribeAudio,
    clearTranscript,
  };
};
