import multer from "multer";
import path from "path";
import fs from "fs";

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 파일명: timestamp_originalname
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${name}${ext}`);
  },
});

// 파일 필터 (오디오 파일만 허용)
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "audio/webm",
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("지원하지 않는 오디오 파일 형식입니다."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한
  },
});

// 에러 핸들링 미들웨어
export const handleUploadError = (
  error: any,
  req: any,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "파일 크기가 너무 큽니다. (최대 50MB)",
      });
    }
    return res.status(400).json({
      success: false,
      error: "파일 업로드 중 오류가 발생했습니다.",
    });
  }

  if (error.message === "지원하지 않는 오디오 파일 형식입니다.") {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next(error);
};


