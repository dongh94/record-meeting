/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * ISO 문자열을 Date 객체로 변환
 */
export const parseISOString = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Date 객체를 한국어 형식으로 포맷팅
 */
export const formatKoreanDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISOString(date) : date;

  return dateObj.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * 상대적 시간 표시 (예: "2시간 전", "방금 전")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISOString(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return "방금 전";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return formatKoreanDate(dateObj);
  }
};
