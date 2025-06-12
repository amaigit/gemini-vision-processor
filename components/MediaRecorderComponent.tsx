
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants';

interface MediaRecorderComponentProps {
  recordType: 'audio' | 'video';
  onRecordingComplete: (blob: Blob, mimeType: string, recordType: 'audio' | 'video') => void;
  disabled?: boolean;
  previewUrl: string | null; // To display the recorded media
  onClearMedia: () => void;
}

export const MediaRecorderComponent: React.FC<MediaRecorderComponentProps> = ({
  recordType,
  onRecordingComplete,
  disabled,
  previewUrl,
  onClearMedia
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const getMimeType = () => {
    if (recordType === 'audio') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
      return 'audio/webm'; // Fallback
    } else { // video
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) return 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) return 'video/webm;codecs=vp8,opus';
      return 'video/webm'; // Fallback
    }
  };

  const startCountdown = async () => {
    return new Promise<void>((resolve) => {
      let count = 3;
      setCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          setCountdown(null);
          resolve();
        }
      }, 1000);
    });
  };
  
  const startRecording = useCallback(async () => {
    setError(null);
    if (isRecording || disabled) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: recordType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
      setStream(mediaStream);

      if (recordType === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
        videoPreviewRef.current.muted = true; // Mute local preview
        videoPreviewRef.current.play().catch(e => console.error("Video preview play error:", e));
      }
      
      await startCountdown();

      const mimeType = getMimeType();
      const recorder = new MediaRecorder(mediaStream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        setDuration(0);
        const recordedBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        if (recordedBlob.size === 0) {
            setError("Recording resulted in an empty file. Please ensure microphone/camera permissions are granted and working.");
            onRecordingComplete(recordedBlob, mimeType, recordType); // Still call it so App can clear state
            return;
        }
        if (recordedBlob.size > MAX_FILE_SIZE_BYTES) {
            setError(`Recording too large (max ${MAX_FILE_SIZE_MB}MB). Please record a shorter clip.`);
            // Don't call onRecordingComplete with the oversized blob, or handle appropriately
            onClearMedia(); // Or allow user to decide
            return;
        }
        onRecordingComplete(recordedBlob, mimeType, recordType);
        recordedChunksRef.current = []; // Clear for next recording
      };
      
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError(`Recording error: ${(event as any)?.error?.name || 'Unknown error'}. Please check permissions and try again.`);
        setIsRecording(false);
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        setDuration(0);
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Error starting recording:", err);
      setError(`Failed to start recording: ${err.message}. Please ensure permissions are granted.`);
      setIsRecording(false);
    }
  }, [recordType, onRecordingComplete, isRecording, disabled, onClearMedia]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }
  }, [isRecording, stream]);
  
  const togglePauseResume = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      durationIntervalRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    // Cleanup stream on component unmount if recording was abruptly stopped or errored
    return () => {
      stream?.getTracks().forEach(track => track.stop());
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [stream]);

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (previewUrl) {
    return (
      <div className="space-y-3 p-4 bg-gray-700/30 rounded-lg">
        <h3 className="text-md font-semibold text-gray-200">
          {recordType === 'audio' ? 'Audio' : 'Video'} Recording Preview:
        </h3>
        {recordType === 'audio' && <audio controls src={previewUrl} className="w-full">Preview not available.</audio>}
        {recordType === 'video' && <video controls src={previewUrl} className="w-full max-h-60 rounded-md bg-black">Preview not available.</video>}
        <button
          onClick={() => { onClearMedia(); setError(null); }}
          disabled={disabled || isRecording}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          Clear Recording
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg">
      {recordType === 'video' && !isRecording && (
        <div className="bg-black rounded-md aspect-video flex items-center justify-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <p className="ml-2">Camera preview will appear here</p>
        </div>
      )}
      {recordType === 'video' && isRecording && (
        <video ref={videoPreviewRef} playsInline className="w-full max-h-60 rounded-md bg-black object-cover" />
      )}
       {recordType === 'audio' && !isRecording && (
        <div className="h-24 bg-gray-700 rounded-md flex flex-col items-center justify-center text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          Ready to record audio
        </div>
      )}
      {isRecording && (
        <div className="text-center text-lg font-mono text-pink-400">
          {isPaused ? "Paused" : "Recording..."} {formatDuration(duration)}
        </div>
      )}

      {countdown !== null && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <p className="text-8xl font-bold text-white">{countdown > 0 ? countdown : "🎤"}</p>
        </div>
      )}

      <div className="flex space-x-2 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || isRecording}
            className="flex-grow bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            Start {recordType === 'audio' ? 'Audio' : 'Video'} Recording
          </button>
        ) : (
          <>
            <button
              onClick={togglePauseResume}
              disabled={disabled || !mediaRecorderRef.current?.pause} // Check if pause is available
              className={`flex-grow ${isPaused ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-600 hover:bg-yellow-700'} text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stopRecording}
              disabled={disabled}
              className="flex-grow bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              Stop Recording
            </button>
          </>
        )}
      </div>
      {error && <p className="text-red-400 text-sm text-center mt-2" role="alert">{error}</p>}
       <p className="text-xs text-gray-500 text-center mt-2">Max recording size: {MAX_FILE_SIZE_MB}MB. Ensure microphone/camera permissions are enabled.</p>
    </div>
  );
};
