export interface Transcript {
  id: string;
  title: string;
  content: string;
  summary: string;
  participants: string[];
  keyPoints: string[];
  actionItems: string[];
  createdAt: Date;
}

export interface TranscriptionRequest {
  audioFile: Express.Multer.File;
}

export interface TranscriptionResponse {
  success: boolean;
  transcript?: Transcript;
  error?: string;
}


