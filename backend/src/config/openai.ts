import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_CONFIG = {
  model: "whisper-1", // 음성 인식용
  chatModel: "gpt-4o-mini", // 회의록 생성용
  maxTokens: 4000,
  temperature: 0.3,
} as const;


