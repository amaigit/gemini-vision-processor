
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_API_KEY } from '../constants';

if (!GEMINI_API_KEY) {
  console.warn(
    "Gemini API key not found. Please set process.env.API_KEY. App will simulate API calls."
  );
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const processMediaWithPrompt = async (
  mediaDataBase64: string,
  mimeType: string,
  prompt: string,
  modelName: string
): Promise<string> => {
  if (!ai) {
    // Simulate API call if key is not available
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Simulated AI Response for prompt "${prompt}": This media (${mimeType}) seems interesting. If the Gemini API key were configured, a real analysis would be provided here.`);
      }, 1500);
    });
  }

  try {
    const mediaPart = {
      inlineData: {
        mimeType: mimeType,
        data: mediaDataBase64,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [mediaPart, textPart] },
    });
    
    const responseText = response.text;
    if (typeof responseText !== 'string') {
        throw new Error('Invalid response format from Gemini API.');
    }
    return responseText;

  } catch (error: any) {
    console.error("Gemini API error:", error);
    if (error.message && error.message.includes("API key not valid")) {
        throw new Error("The provided Gemini API key is not valid. Please check your .env configuration.");
    }
     if (error.message && error.message.includes("fetch_error")) {
         throw new Error("A network error occurred while contacting the Gemini API. Please check your internet connection.");
    }
    // More specific error handling for Gemini
    if (error.message && error.message.includes("candidate.finishReason")) {
        // This could indicate safety blocks or other content generation issues
        throw new Error(`Gemini API processing issue: ${error.message}. The content might have been blocked.`);
    }
    if (error.status === 400 || (error.message && error.message.toLowerCase().includes("invalid"))) {
        throw new Error(`Gemini API Bad Request: ${error.message}. Check the media format or prompt.`);
    }
    if (error.status === 500) {
        throw new Error("Gemini API server error. Please try again later.");
    }
    throw new Error(`Error calling Gemini API: ${error.message || 'Unknown error'}`);
  }
};
