import { useState, useCallback } from "react";
import { getApiUrl, API_CONFIG } from "../config/api";
import { Transcript } from "./useTranscription";

export interface ConfluenceUploadOptions {
  spaceKey?: string;
  parentId?: string;
}

export interface ConfluenceUploadResult {
  pageUrl: string;
  pageId: string;
}

export interface ConfluenceSpace {
  key: string;
  name: string;
  id: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  parentId?: string;
  parentType?: string;
  level: number;
  hasChildren: boolean;
  position?: number;
}

export interface UseConfluenceReturn {
  isUploading: boolean;
  isLoadingSpaces: boolean;
  isLoadingPages: boolean;
  error: string | null;
  spaces: ConfluenceSpace[];
  pages: ConfluencePage[];
  lastUploadResult: ConfluenceUploadResult | null;
  uploadToConfluence: (
    transcript: Transcript,
    options?: ConfluenceUploadOptions
  ) => Promise<ConfluenceUploadResult | null>;
  loadSpaces: (forceRefresh?: boolean) => Promise<void>;
  loadPages: (spaceKey: string, forceRefresh?: boolean) => Promise<void>;
  clearPages: () => void;
  clearError: () => void;
}

export const useConfluence = (): UseConfluenceReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<ConfluenceSpace[]>([]);
  const [pages, setPages] = useState<ConfluencePage[]>([]);
  const [lastUploadResult, setLastUploadResult] =
    useState<ConfluenceUploadResult | null>(null);

  const uploadToConfluence = useCallback(
    async (
      transcript: Transcript,
      options?: ConfluenceUploadOptions
    ): Promise<ConfluenceUploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        console.log("🔄 Confluence 업로드 시작:");
        console.log("- 회의록 ID:", transcript.id);
        console.log("- 제목:", transcript.title);
        console.log("- 옵션:", options);

        const requestBody = {
          transcript,
          ...options,
        };

        console.log("📤 요청 데이터:", requestBody);

        const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.CONFLUENCE_UPLOAD);
        console.log("🌐 API 요청:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("📥 응답 수신:");
        console.log("- 상태 코드:", response.status);
        console.log("- 상태 텍스트:", response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ HTTP 오류:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("📋 응답 데이터:", result);

        if (!result.success) {
          console.error("❌ API 오류:", result.error);
          throw new Error(result.error || "Confluence 업로드에 실패했습니다.");
        }

        const uploadResult: ConfluenceUploadResult = {
          pageUrl: result.pageUrl,
          pageId: result.pageId,
        };

        console.log("✅ Confluence 업로드 성공:", uploadResult);
        setLastUploadResult(uploadResult);

        return uploadResult;
      } catch (err) {
        console.error("❌ Confluence 업로드 실패:", err);

        let errorMessage = "Confluence 업로드 중 오류가 발생했습니다.";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }

        // HTTP 상태 코드별 메시지 개선
        if (errorMessage.includes("status: 500")) {
          errorMessage =
            "서버에서 오류가 발생했습니다. Confluence 설정을 확인해주세요.";
        } else if (errorMessage.includes("status: 401")) {
          errorMessage =
            "Confluence 인증에 실패했습니다. API 토큰을 확인해주세요.";
        } else if (errorMessage.includes("status: 403")) {
          errorMessage =
            "Confluence 접근 권한이 없습니다. 권한을 확인해주세요.";
        }

        setError(errorMessage);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const loadSpaces = useCallback(async (forceRefresh = false) => {
    setIsLoadingSpaces(true);
    setError(null);

    try {
      console.log(
        `🔄 스페이스 목록 로드 시작 ${forceRefresh ? "(강제 새로고침)" : ""}`
      );

      const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.CONFLUENCE_SPACES);

      // 강제 새로고침 시 캐시 무시
      const fetchOptions: RequestInit = {
        method: "GET",
      };

      if (forceRefresh) {
        fetchOptions.cache = "no-cache";
        fetchOptions.headers = {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        };
      }

      const response = await fetch(apiUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "스페이스 목록 조회에 실패했습니다.");
      }

      console.log("✅ 스페이스 목록 로드 성공:", result.data.length, "개");
      setSpaces(result.data);
    } catch (err) {
      console.error("❌ 스페이스 목록 로드 실패:", err);

      let errorMessage = "스페이스 목록을 불러오는데 실패했습니다.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, []);

  const loadPages = useCallback(
    async (spaceKey: string, forceRefresh = false) => {
      setIsLoadingPages(true);
      setError(null);

      try {
        console.log(
          `🔄 페이지 목록 로드 시작: ${spaceKey} ${
            forceRefresh ? "(강제 새로고침)" : ""
          }`
        );

        const apiUrl = getApiUrl(
          `${API_CONFIG.ENDPOINTS.CONFLUENCE_SPACE_PAGES}/${spaceKey}/pages`
        );

        // 강제 새로고침 시 캐시 무시
        const fetchOptions: RequestInit = {
          method: "GET",
        };

        if (forceRefresh) {
          fetchOptions.cache = "no-cache";
          fetchOptions.headers = {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          };
        }

        const response = await fetch(apiUrl, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "페이지 목록 조회에 실패했습니다.");
        }

        console.log("✅ 페이지 목록 로드 성공:", result.data.length, "개");
        setPages(result.data);
      } catch (err) {
        console.error("❌ 페이지 목록 로드 실패:", err);

        let errorMessage = "페이지 목록을 불러오는데 실패했습니다.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setIsLoadingPages(false);
      }
    },
    []
  );

  const clearPages = useCallback(() => {
    setPages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUploading,
    isLoadingSpaces,
    isLoadingPages,
    error,
    spaces,
    pages,
    lastUploadResult,
    uploadToConfluence,
    loadSpaces,
    loadPages,
    clearPages,
    clearError,
  };
};
