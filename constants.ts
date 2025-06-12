
// IMPORTANT: In a real application, API keys should never be hardcoded.
// This uses process.env.API_KEY which should be set in your environment.
// For local development, you might use a .env file with a tool like dotenv.
export const GEMINI_API_KEY: string | undefined = process.env.API_KEY;

// See https://ai.google.dev/models/gemini for model information
// 'gemini-2.5-flash-preview-04-17' is a multimodal model suitable for text, image, audio and video inputs.
export const GEMINI_MODEL_NAME: string = 'gemini-2.5-flash-preview-04-17';

export const ACCEPTED_IMAGE_TYPES = "image/png, image/jpeg, image/webp, image/gif, image/heic, image/heif";
export const ACCEPTED_AUDIO_TYPES = "audio/mp3, audio/wav, audio/mpeg, audio/ogg, audio/m4a, audio/flac, audio/aac, audio/amr";
// Common video types. Note that browser support for previewing all of these might vary.
// Gemini supports: video/mp4, video/mpeg, video/mov, video/avi, video/x-flv, video/mpg, video/webm, video/wmv, video/3gpp.
export const ACCEPTED_VIDEO_TYPES = "video/mp4, video/mpeg, video/mov, video/avi, video/webm, video/quicktime, video/x-ms-wmv, video/3gpp";

export const MAX_FILE_SIZE_MB = 10; // Example: 10MB limit for uploads
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
