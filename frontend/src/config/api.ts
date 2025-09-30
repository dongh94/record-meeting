// API 설정
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  ENDPOINTS: {
    TRANSCRIPTION_UPLOAD: "/api/transcription/upload",
    TRANSCRIPTION_HEALTH: "/api/transcription/health",
    CONFLUENCE_UPLOAD: "/api/confluence/upload",
    CONFLUENCE_HEALTH: "/api/confluence/health",
    CONFLUENCE_SPACES: "/api/confluence/spaces",
    CONFLUENCE_SPACE_PAGES: "/api/confluence/spaces",
  },
} as const;

// API URL 생성 헬퍼 함수
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
