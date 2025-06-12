
import { MAX_FILE_SIZE_BYTES } from '../constants';

export const fileOrBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (blob.size > MAX_FILE_SIZE_BYTES * 4/3) { // Base64 encoding increases size by ~33%
        // Approximate check, actual base64 string size could be larger.
        // A more accurate check would be on the blob.size itself if Gemini has direct size limits for base64 payload.
        // For now, let's assume the MAX_FILE_SIZE_BYTES applies to the raw file.
        // This check is more illustrative for the *raw* file size before encoding to base64.
        // The actual check for Gemini should be based on their payload limits.
    }

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error('Failed to extract base64 data from file/blob.'));
        }
      } else {
        reject(new Error('Failed to read file/blob as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeTypeFromBlob = (blob: Blob): string => {
    // Basic MIME type extraction, prioritizes blob.type.
    // For more robust extraction, especially for files without explicit types,
    // a more sophisticated library or magic number checking might be needed,
    // but for browser-recorded or user-selected files, blob.type is usually reliable.
    if (blob.type) {
        return blob.type;
    }
    // Fallback for common types based on extension if blob.type is missing (less reliable)
    if (blob instanceof File) {
        const fileName = (blob as File).name.toLowerCase();
        if (fileName.endsWith('.mp3')) return 'audio/mpeg';
        if (fileName.endsWith('.wav')) return 'audio/wav';
        if (fileName.endsWith('.ogg')) return 'audio/ogg'; // Can be audio or video
        if (fileName.endsWith('.mp4')) return 'video/mp4';
        if (fileName.endsWith('.webm')) return 'video/webm';
        if (fileName.endsWith('.mov')) return 'video/quicktime';
        if (fileName.endsWith('.png')) return 'image/png';
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
        if (fileName.endsWith('.gif')) return 'image/gif';
    }
    return 'application/octet-stream'; // Default if unknown
};
