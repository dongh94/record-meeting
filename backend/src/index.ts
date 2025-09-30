import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import transcriptionRoutes from "./routes/transcription";
import confluenceRoutes from "./routes/confluence";

// 환경 변수 로드
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// 미들웨어 설정
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 요청 로깅
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 라우트 설정
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/confluence", confluenceRoutes);

// 기본 라우트
app.get("/", (req, res) => {
  res.json({
    message: "AI Meeting Transcription Backend",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API 엔드포인트를 찾을 수 없습니다.",
  });
});

// 에러 핸들러
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "서버 내부 오류가 발생했습니다.",
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);

  // OpenAI API 키 확인
  if (!process.env.OPENAI_API_KEY) {
    console.warn(
      "⚠️  OPENAI_API_KEY is not set. Please check your environment variables."
    );
  } else {
    console.log("✅ OpenAI API key is configured");
  }
});

export default app;
