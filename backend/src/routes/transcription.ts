import { Router, Request, Response } from "express";
import { TranscriptionService } from "../services/transcriptionService";
import { upload, handleUploadError } from "../middleware/upload";
import { TranscriptionResponse } from "../types";

const router = Router();
const transcriptionService = new TranscriptionService();

/**
 * POST /api/transcription/upload
 * 오디오 파일을 업로드하고 회의록을 생성합니다.
 */
router.post(
  "/upload",
  upload.single("audio"),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      console.log("🎵 업로드 요청 수신:");
      console.log("- 요청 헤더:", req.headers);
      console.log("- Content-Type:", req.headers["content-type"]);

      if (!req.file) {
        console.error("❌ 파일이 업로드되지 않음");
        return res.status(400).json({
          success: false,
          error: "오디오 파일이 필요합니다.",
        } as TranscriptionResponse);
      }

      console.log("📁 업로드된 파일 정보:");
      console.log("- 파일명:", req.file.filename);
      console.log("- 원본 파일명:", req.file.originalname);
      console.log("- 파일 크기:", req.file.size, "bytes");
      console.log("- MIME 타입:", req.file.mimetype);
      console.log("- 저장 경로:", req.file.path);

      console.log("🔄 회의록 생성 시작...");

      // 오디오 파일을 처리하여 회의록 생성
      const transcript = await transcriptionService.processAudioToTranscript(
        req.file.path
      );

      console.log("✅ 회의록 생성 완료:", transcript.id);
      console.log("📋 생성된 회의록:", {
        id: transcript.id,
        title: transcript.title,
        participantsCount: transcript.participants.length,
        keyPointsCount: transcript.keyPoints.length,
        actionItemsCount: transcript.actionItems.length,
      });

      res.json({
        success: true,
        transcript,
      } as TranscriptionResponse);
    } catch (error) {
      console.error("❌ 회의록 생성 실패:", error);

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "회의록 생성 중 오류가 발생했습니다.",
      } as TranscriptionResponse);
    }
  }
);

/**
 * GET /api/transcription/health
 * API 상태 확인
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Transcription service is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
