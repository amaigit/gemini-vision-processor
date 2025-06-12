
import React from 'react';
import { ProcessedResult } from '../types';

interface ResultDisplayProps {
  result: ProcessedResult;
  onSendToServer: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onSendToServer }) => {
  return (
    <div className="mt-6 p-6 bg-gray-700/50 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-purple-300">AI Analysis Complete</h2>
      
      <div>
        <h3 className="text-sm font-medium text-gray-400">Original Media:</h3>
        <p className="text-gray-200 text-sm italic">{result.originalMediaName} ({result.originalMimeType})</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400">Your Prompt:</h3>
        <p className="text-gray-200 bg-gray-600/50 p-2 rounded whitespace-pre-wrap break-words">{result.prompt}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400">Gemini's Response:</h3>
        <div className="text-gray-200 bg-gray-600/50 p-3 rounded-md whitespace-pre-wrap break-words max-h-96 overflow-y-auto"
          aria-label="AI response text"
        >
          {result.aiResponse}
        </div>
      </div>

      <button
        onClick={onSendToServer}
        className="w-full mt-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 ease-in-out flex items-center justify-center"
        aria-label="Send results to server (simulated)"
      >
        <PaperAirplaneIcon className="w-5 h-5 mr-2"/>
        Send Results to Server (Simulated)
      </button>
    </div>
  );
};

// Placeholder PaperAirplaneIcon (typically from a library like heroicons)
const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
