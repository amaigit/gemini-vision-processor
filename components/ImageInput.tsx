
import React, { useRef, useMemo } from 'react';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_AUDIO_TYPES, ACCEPTED_VIDEO_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants';

type MediaType = 'image' | 'audio' | 'video';

interface MediaInputProps {
  onMediaSelected: (file: File | null, mediaType: MediaType) => void;
  mediaPreviewUrl: string | null;
  selectedMediaType: MediaType;
  disabled?: boolean;
  onPreviewError?: () => void;
}

export const MediaInput: React.FC<MediaInputProps> = ({ 
  onMediaSelected, 
  mediaPreviewUrl, 
  selectedMediaType, 
  disabled,
  onPreviewError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = useMemo(() => {
    switch (selectedMediaType) {
      case 'image': return ACCEPTED_IMAGE_TYPES;
      case 'audio': return ACCEPTED_AUDIO_TYPES;
      case 'video': return ACCEPTED_VIDEO_TYPES;
      default: return '';
    }
  }, [selectedMediaType]);

  const mediaName = useMemo(() => {
    switch (selectedMediaType) {
      case 'image': return 'Image';
      case 'audio': return 'Audio';
      case 'video': return 'Video';
      default: return 'Media';
    }
  }, [selectedMediaType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`${mediaName} file size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        onMediaSelected(null, selectedMediaType);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      onMediaSelected(file, selectedMediaType);
    } else {
      onMediaSelected(null, selectedMediaType);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!acceptedTypes.split(',').map(t => t.trim()).includes(file.type)) {
        alert(`Invalid file type. Please upload a ${selectedMediaType} file (${acceptedTypes}).`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`${mediaName} file size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      onMediaSelected(file, selectedMediaType);
      if (fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files;
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const renderPreview = () => {
    if (!mediaPreviewUrl) return null;
    switch (selectedMediaType) {
      case 'image':
        return <img src={mediaPreviewUrl} alt="Preview" onError={onPreviewError} className="mx-auto max-h-48 w-auto object-contain rounded-md shadow-md" />;
      case 'audio':
        return <audio controls src={mediaPreviewUrl} onError={onPreviewError} className="w-full">Your browser does not support the audio element.</audio>;
      case 'video':
        return <video controls src={mediaPreviewUrl} onError={onPreviewError} className="mx-auto max-h-48 w-auto object-contain rounded-md shadow-md">Your browser does not support the video tag.</video>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="media-upload-input"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`mt-1 flex flex-col justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer group hover:border-purple-500 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={`Upload ${selectedMediaType}`}
      >
        <div className="space-y-1 text-center w-full">
          {mediaPreviewUrl ? (
            renderPreview()
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-500 group-hover:text-purple-400 transition-colors"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                {selectedMediaType === 'image' && <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                {selectedMediaType === 'audio' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />}
                {selectedMediaType === 'video' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}
              </svg>
              <div className="flex text-sm text-gray-500 group-hover:text-purple-400 transition-colors">
                <span className="relative rounded-md font-medium text-purple-500 group-hover:text-purple-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-purple-500">
                  Upload a {selectedMediaType}
                </span>
                <input
                  id="media-upload-input"
                  name="media-upload-input"
                  type="file"
                  className="sr-only"
                  accept={acceptedTypes}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={disabled}
                />
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-600 group-hover:text-gray-500 transition-colors">
                {acceptedTypes.split(',').map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {MAX_FILE_SIZE_MB}MB
              </p>
            </>
          )}
        </div>
      </label>
      {mediaPreviewUrl && !disabled && (
         <button 
            type="button" 
            onClick={() => { onMediaSelected(null, selectedMediaType); if(fileInputRef.current) fileInputRef.current.value = ""; }}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Clear {selectedMediaType}
          </button>
      )}
    </div>
  );
};
