
export interface ProcessedResult {
  originalMediaName: string;
  originalMimeType: string;
  prompt: string;
  aiResponse: string;
}

export interface AppError {
  message: string;
  details?: string;
}

export type InputMode = 
  | 'upload_image' 
  | 'upload_audio' 
  | 'upload_video' 
  | 'record_audio' 
  | 'record_video';

export interface MediaData {
  blob: Blob; // Could be File or recorded Blob
  name: string;
  mimeType: string;
  previewUrl: string; // Data URL or Object URL
}
