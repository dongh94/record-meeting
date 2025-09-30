import { openai, OPENAI_CONFIG } from "../config/openai";
import { Transcript } from "../types";
import fs from "fs";
import path from "path";

export class TranscriptionService {
  /**
   * 오디오 파일을 텍스트로 변환
   */
  async transcribeAudio(audioFilePath: string): Promise<string> {
    try {
      // OpenAI API 키가 없는 경우 명확한 오류 메시지
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OpenAI API 키가 설정되지 않았습니다. 환경변수를 확인해주세요."
        );
      }

      const audioFile = fs.createReadStream(audioFilePath);

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: OPENAI_CONFIG.model,
        language: "ko", // 한국어 설정
        response_format: "text",
      });

      return transcription;
    } catch (error: any) {
      console.error("Audio transcription failed:", error);

      // 할당량 초과 오류인 경우 더 친절한 메시지
      if (error.status === 429 || error.code === "insufficient_quota") {
        throw new Error(
          "OpenAI API 할당량이 초과되었습니다. 계정의 결제 정보와 사용량을 확인해주세요."
        );
      }

      // API 키 관련 오류
      if (error.status === 401) {
        throw new Error(
          "OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요."
        );
      }

      // 네트워크 오류
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new Error(
          "OpenAI 서비스에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
        );
      }

      // 기타 오류
      throw new Error(
        `음성 인식에 실패했습니다: ${
          error.message || "알 수 없는 오류가 발생했습니다."
        }`
      );
    }
  }

  /**
   * 텍스트를 구조화된 회의록으로 변환
   */
  async generateMeetingMinutes(
    transcribedText: string
  ): Promise<Omit<Transcript, "id" | "createdAt">> {
    try {
      // OpenAI API 키가 없는 경우 오류 발생
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OpenAI API 키가 설정되지 않았습니다. 회의록 생성을 위해 API 키가 필요합니다."
        );
      }

      const prompt = `
다음은 회의 음성을 텍스트로 변환한 내용입니다. 이를 바탕으로 구조화된 회의록을 생성해주세요.

회의 내용:
${transcribedText}

다음 JSON 형식으로 응답해주세요:
{
  "title": "회의 제목 (내용을 바탕으로 적절한 제목 생성)",
  "content": "회의 전체 내용을 정리한 상세 내용",
  "summary": "회의 요약 (2-3문장)",
  "participants": ["참석자1", "참석자2", ...] (언급된 이름들을 추출),
  "keyPoints": ["핵심 포인트1", "핵심 포인트2", ...] (주요 논의사항들),
  "actionItems": ["액션 아이템1", "액션 아이템2", ...] (해야 할 일들과 담당자, 마감일 포함)
}

주의사항:
- 모든 텍스트는 한국어로 작성
- 참석자 이름이 명확하지 않으면 "참석자1", "참석자2" 등으로 표시
- 액션 아이템은 "담당자: 할 일 (마감: 날짜)" 형식으로 작성
- JSON 형식을 정확히 지켜주세요
`;

      const completion = await openai.chat.completions.create({
        model: OPENAI_CONFIG.chatModel,
        messages: [
          {
            role: "system",
            content:
              "당신은 회의록 작성 전문가입니다. 주어진 회의 내용을 바탕으로 구조화된 회의록을 생성합니다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("AI 응답을 받을 수 없습니다.");
      }

      // JSON 파싱
      const meetingData = JSON.parse(response);

      return {
        title: meetingData.title || "회의록",
        content: meetingData.content || transcribedText,
        summary: meetingData.summary || "회의 요약을 생성할 수 없습니다.",
        participants: Array.isArray(meetingData.participants)
          ? meetingData.participants
          : [],
        keyPoints: Array.isArray(meetingData.keyPoints)
          ? meetingData.keyPoints
          : [],
        actionItems: Array.isArray(meetingData.actionItems)
          ? meetingData.actionItems
          : [],
      };
    } catch (error: any) {
      console.error("Meeting minutes generation failed:", error);

      // 할당량 초과 오류
      if (error.status === 429 || error.code === "insufficient_quota") {
        throw new Error(
          "OpenAI API 할당량이 초과되었습니다. 계정의 결제 정보와 사용량을 확인해주세요."
        );
      }

      // API 키 관련 오류
      if (error.status === 401) {
        throw new Error(
          "OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요."
        );
      }

      // 네트워크 오류
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new Error(
          "OpenAI 서비스에 연결할 수 없습니다. 네트워크 연결을 확인해주세요."
        );
      }

      // 기타 오류
      throw new Error(
        `회의록 생성에 실패했습니다: ${
          error.message || "알 수 없는 오류가 발생했습니다."
        }`
      );
    }
  }

  /**
   * 전체 프로세스: 오디오 파일을 받아서 완성된 회의록 반환
   */
  async processAudioToTranscript(audioFilePath: string): Promise<Transcript> {
    try {
      // 1. 음성을 텍스트로 변환
      const transcribedText = await this.transcribeAudio(audioFilePath);

      // 2. 텍스트를 구조화된 회의록으로 변환
      const meetingData = await this.generateMeetingMinutes(transcribedText);

      // 3. 최종 회의록 객체 생성
      const transcript: Transcript = {
        id: `transcript-${Date.now()}`,
        ...meetingData,
        createdAt: new Date(),
      };

      return transcript;
    } catch (error) {
      console.error("Full transcription process failed:", error);
      throw error;
    } finally {
      // 임시 파일 정리
      try {
        if (fs.existsSync(audioFilePath)) {
          fs.unlinkSync(audioFilePath);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup temp file:", cleanupError);
      }
    }
  }
}
