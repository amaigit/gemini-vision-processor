
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MediaInput } from './components/ImageInput'; // Corrected path
import { PromptInput } from './components/PromptInput';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { MediaRecorderComponent } from './components/MediaRecorderComponent'; // New component
import { processMediaWithPrompt } from './services/geminiService';
import { fileOrBlobToBase64, getMimeTypeFromBlob } from './utils/fileUtils';
import { AppError, ProcessedResult, InputMode, MediaData } from './types';
import { GEMINI_MODEL_NAME, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './constants';

const App: React.FC = () => {
  const [currentInputMode, setCurrentInputMode] = useState<InputMode>('upload_image');
  const [mediaData, setMediaData] = useState<MediaData | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const previousMediaPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    // Clean up old object URLs
    if (previousMediaPreviewUrl.current && previousMediaPreviewUrl.current.startsWith('blob:')) {
      URL.revokeObjectURL(previousMediaPreviewUrl.current);
    }
    previousMediaPreviewUrl.current = mediaData?.previewUrl || null;

    // Cleanup on unmount
    return () => {
      if (mediaData?.previewUrl && mediaData.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaData.previewUrl);
      }
    };
  }, [mediaData?.previewUrl]);


  const handleMediaFileSelected = useCallback((file: File | null, mediaTypeFromFile: 'image' | 'audio' | 'video') => {
    setProcessedResult(null);
    setError(null);
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError({message: `${mediaTypeFromFile} file size exceeds ${MAX_FILE_SIZE_MB}MB limit.`});
        setMediaData(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaData({
          blob: file,
          name: file.name,
          mimeType: file.type || getMimeTypeFromBlob(file),
          previewUrl: reader.result as string,
        });
      };
      reader.onerror = () => {
        setError({ message: `Failed to read ${mediaTypeFromFile} file.`});
        setMediaData(null);
      }
      reader.readAsDataURL(file);
    } else {
      setMediaData(null);
    }
  }, []);

  const handleRecordingComplete = useCallback((blob: Blob, mimeType: string, recordType: 'audio' | 'video') => {
    setProcessedResult(null);
    setError(null);
    if (blob.size === 0) {
      setError({ message: "Recording is empty. Please try again."});
      setMediaData(null);
      return;
    }
     if (blob.size > MAX_FILE_SIZE_BYTES) { // Check size for recordings too
        setError({message: `Recorded ${recordType} size exceeds ${MAX_FILE_SIZE_MB}MB limit.`});
        setMediaData(null);
        return;
      }
    const previewUrl = URL.createObjectURL(blob);
    setMediaData({
      blob,
      name: `recording.${mimeType.split('/')[1] || 'bin'}`,
      mimeType,
      previewUrl,
    });
  }, []);
  
  const handlePreviewError = useCallback(() => {
    setError({ message: `Failed to load ${currentInputMode.split('_')[1]} preview. The file might be corrupted or in an unsupported format for browser preview.` });
    // Keep mediaData as it might still be processable by Gemini, but clear preview or show placeholder
    if (mediaData) {
        // setMediaData(prev => prev ? {...prev, previewUrl: ''} : null); // Option: clear preview URL
    }
  }, [currentInputMode, mediaData]);


  const handleSubmit = async () => {
    if (!mediaData || !promptText.trim()) {
      setError({ message: 'Please provide media and a prompt.' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedResult(null);

    try {
      const base64Data = await fileOrBlobToBase64(mediaData.blob);
      
      const aiResponseText = await processMediaWithPrompt(base64Data, mediaData.mimeType, promptText, GEMINI_MODEL_NAME);
      
      setProcessedResult({
        originalMediaName: mediaData.name,
        originalMimeType: mediaData.mimeType,
        prompt: promptText,
        aiResponse: aiResponseText,
      });

    } catch (err: any) {
      console.error("Error processing media:", err);
      setError({ message: err.message || 'Failed to process media with AI.', details: err.toString() });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToServer = useCallback(() => {
    if (processedResult) {
      console.log("Simulating sending data to server:", processedResult);
      alert(`Data (simulated) sent to server for: ${processedResult.originalMediaName}. Check console.`);
    }
  }, [processedResult]);

  const clearMedia = () => {
    setMediaData(null);
    setProcessedResult(null);
    setError(null);
  }

  const inputModeOptions: { label: string; value: InputMode; type: 'upload' | 'record'; mediaType?: 'image' | 'audio' | 'video' }[] = [
    { label: 'Upload Image', value: 'upload_image', type: 'upload', mediaType: 'image' },
    { label: 'Upload Audio', value: 'upload_audio', type: 'upload', mediaType: 'audio' },
    { label: 'Upload Video', value: 'upload_video', type: 'upload', mediaType: 'video' },
    { label: 'Record Audio', value: 'record_audio', type: 'record', mediaType: 'audio' },
    { label: 'Record Video', value: 'record_video', type: 'record', mediaType: 'video' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 font-sans">
      <header className="w-full max-w-3xl mb-6 sm:mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Gemini Media Processor
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Upload or record media, provide a prompt, and let Gemini analyze it.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Input Mode:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {inputModeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setCurrentInputMode(opt.value); clearMedia(); }}
                disabled={isLoading}
                className={`p-2 rounded-md text-sm font-medium transition-colors ${
                  currentInputMode === opt.value 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        {currentInputMode.startsWith('upload_') && (
          <MediaInput
            onMediaSelected={handleMediaFileSelected}
            mediaPreviewUrl={mediaData?.previewUrl || null}
            selectedMediaType={currentInputMode.split('_')[1] as 'image' | 'audio' | 'video'}
            disabled={isLoading}
            onPreviewError={handlePreviewError}
          />
        )}

        {currentInputMode.startsWith('record_') && (
          <MediaRecorderComponent
            recordType={currentInputMode.split('_')[1] as 'audio' | 'video'}
            onRecordingComplete={handleRecordingComplete}
            disabled={isLoading}
            previewUrl={mediaData?.previewUrl || null}
            onClearMedia={clearMedia}
          />
        )}
        
        <PromptInput value={promptText} onChange={setPromptText} disabled={isLoading} />

        <button
          onClick={handleSubmit}
          disabled={isLoading || !mediaData || !promptText.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-live="polite"
        >
          {isLoading ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" /> }
          {isLoading ? 'Processing...' : 'Process with AI'}
        </button>

        {error && (
          <div role="alert" className="mt-4 p-4 bg-red-800/70 border border-red-700 text-red-200 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{error.message}</p>
            {error.details && <p className="text-xs mt-1 opacity-75">Details: {error.details}</p>}
          </div>
        )}

        {processedResult && !isLoading && (
          <ResultDisplay result={processedResult} onSendToServer={handleSendToServer} />
        )}
      </main>

      <footer className="mt-10 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Media Processor. Powered by Gemini.</p>
        <p>This is a frontend demonstration. API key for Gemini must be configured in environment.</p>
      </footer>
    </div>
  );
};

// Placeholder SparklesIcon
const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.25l-1.25-2.25L13.5 11l2.25-1.25L17 7.5l1.25 2.25L20.5 11l-2.25 1.25z" />
  </svg>
);

export default App;
