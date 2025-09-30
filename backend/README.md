# AI Meeting Transcription Backend

OpenAI API를 활용한 회의록 자동 생성 백엔드 서비스입니다.

## 기능

- 오디오 파일 업로드 및 처리
- OpenAI Whisper를 이용한 음성 인식
- GPT-4를 이용한 구조화된 회의록 생성
- CORS 지원으로 프론트엔드와 연동

## 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

### 4. 프로덕션 빌드 및 실행

```bash
pnpm build
pnpm start
```

## API 엔드포인트

### POST /api/transcription/upload

오디오 파일을 업로드하고 회의록을 생성합니다.

**요청:**

- Content-Type: multipart/form-data
- Body: audio 파일 (최대 50MB)

**응답:**

```json
{
  "success": true,
  "transcript": {
    "id": "transcript-1234567890",
    "title": "회의 제목",
    "content": "회의 전체 내용...",
    "summary": "회의 요약",
    "participants": ["참석자1", "참석자2"],
    "keyPoints": ["핵심 포인트1", "핵심 포인트2"],
    "actionItems": ["액션 아이템1", "액션 아이템2"],
    "createdAt": "2023-12-25T10:00:00.000Z"
  }
}
```

### GET /api/transcription/health

서비스 상태를 확인합니다.

## 지원하는 오디오 형식

- WebM (audio/webm)
- WAV (audio/wav)
- MP3 (audio/mp3, audio/mpeg)
- MP4 Audio (audio/mp4)
- M4A (audio/m4a)
- OGG (audio/ogg)

## 기술 스택

- Node.js + TypeScript
- Express.js
- OpenAI API (Whisper + GPT-4)
- Multer (파일 업로드)
- CORS

## 프로젝트 구조

```
src/
├── config/          # 설정 파일들
│   └── openai.ts    # OpenAI 설정
├── middleware/      # 미들웨어
│   └── upload.ts    # 파일 업로드 처리
├── routes/          # API 라우트
│   └── transcription.ts
├── services/        # 비즈니스 로직
│   └── transcriptionService.ts
├── types/           # TypeScript 타입 정의
│   └── index.ts
└── index.ts         # 메인 서버 파일
```
