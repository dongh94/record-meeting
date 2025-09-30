import express, { Router } from "express";
import { ConfluenceService } from "../services/confluenceService";
import { Transcript } from "../types";

const router: Router = express.Router();
const confluenceService = new ConfluenceService();

/**
 * Confluence 연동 상태 확인
 */
router.get("/health", (req, res) => {
  try {
    // 환경 변수 확인
    const requiredEnvVars = [
      "CONFLUENCE_BASE_URL",
      "CONFLUENCE_EMAIL",
      "CONFLUENCE_API_TOKEN",
      "CONFLUENCE_SPACE_KEY",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Confluence 설정이 완료되지 않았습니다.",
        missingVariables: missingVars,
      });
    }

    res.json({
      success: true,
      message: "Confluence 연동 설정이 완료되었습니다.",
      baseUrl: process.env.CONFLUENCE_BASE_URL,
      spaceKey: process.env.CONFLUENCE_SPACE_KEY,
    });
  } catch (error) {
    console.error("Confluence health check 오류:", error);
    res.status(500).json({
      success: false,
      error: "Confluence 상태 확인 중 오류가 발생했습니다.",
    });
  }
});

/**
 * 스페이스 목록 조회
 */
router.get("/spaces", async (req, res) => {
  try {
    console.log("🔄 Confluence 스페이스 목록 조회 요청");

    const spaces = await confluenceService.getSpaces();

    console.log("✅ 스페이스 목록 조회 성공:", spaces.length, "개");

    res.json({
      success: true,
      data: spaces,
    });
  } catch (error) {
    console.error("❌ 스페이스 목록 조회 실패:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "스페이스 목록 조회 중 오류가 발생했습니다.",
    });
  }
});

/**
 * 특정 스페이스의 페이지 목록 조회
 */
router.get("/spaces/:spaceKey/pages", async (req, res) => {
  try {
    const { spaceKey } = req.params;
    const { parentId } = req.query;

    console.log("🔄 페이지 목록 조회 요청:", { spaceKey, parentId });

    const pages = await confluenceService.getPages(
      spaceKey,
      parentId as string
    );

    console.log("✅ 페이지 목록 조회 성공:", pages.length, "개");

    res.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("❌ 페이지 목록 조회 실패:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "페이지 목록 조회 중 오류가 발생했습니다.",
    });
  }
});

/**
 * 회의록을 Confluence 페이지로 업로드
 */
router.post("/upload", async (req, res) => {
  try {
    const { transcript, spaceKey, parentId } = req.body;

    console.log("🔄 Confluence 업로드 요청:", {
      transcriptId: transcript?.id,
      title: transcript?.title,
      spaceKey,
      parentId,
    });

    // 요청 데이터 검증
    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: "회의록 데이터가 필요합니다.",
      });
    }

    if (!transcript.title || !transcript.content) {
      return res.status(400).json({
        success: false,
        error: "회의록 제목과 내용이 필요합니다.",
      });
    }

    // Confluence 페이지 생성
    const result = await confluenceService.createPage(
      transcript as Transcript,
      {
        spaceKey,
        parentId,
      }
    );

    console.log("✅ Confluence 업로드 성공:", result.id);

    res.json({
      success: true,
      data: {
        pageId: result.id,
        title: result.title,
        url: result.webui,
      },
    });
  } catch (error) {
    console.error("❌ Confluence 업로드 실패:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Confluence 업로드 중 오류가 발생했습니다.",
    });
  }
});

export default router;
