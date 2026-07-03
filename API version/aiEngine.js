import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { generateQrCodeTool } from './tools.js';

// SECURE: Pulls the API key safely from your .env file
const API_KEY = process.env.GEMINI_API_KEY; 

if (!API_KEY) {
    console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is missing in your .env file!");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Factory function to spin up a new configured chat instance using native tool declarations
 */
export function initializeChatSession() {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            tools: [{ functionDeclarations: [generateQrCodeTool] }],
            systemInstruction: "You are a fully capable, helpful AI assistant named 'AI hai Bhaisahab'. Answer all general knowledge, coding, and conversational questions normally. If and only if the user explicitly asks you to generate, create, or make a QR code from a URL, use the generateQrCode tool.",
        }
    });
}