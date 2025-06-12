
import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-1">
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
        Your Prompt
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={3}
        className="block w-full shadow-sm sm:text-sm bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors placeholder-gray-500 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="e.g., Describe this media, what objects are present, what style is it?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Prompt for AI analysis"
      />
    </div>
  );
};
