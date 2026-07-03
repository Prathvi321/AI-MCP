import 'dotenv/config';
import { OpenAI } from 'openai';

const ollama = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', 
});

const LOCAL_MODEL = 'gemma2:9b'; 

export async function sendChatMessage(messages) {
    const completeMessages = [...messages];
    const hasSystemInstruction = completeMessages.some(m => m.role === 'system');
    
    if (!hasSystemInstruction) {
        completeMessages.unshift({
            role: 'system',
            content: `You are a fully capable, helpful AI assistant named 'AI hai Bhaisahab'. 
            Answer all general knowledge, coding, and conversational questions normally. 
            
            CRITICAL INSTRUCTION: If and only if the user explicitly asks you to generate, create, or make a QR code from a URL, you must reply EXACTLY with the phrase "[TRIGGER_QR: <url>]" replacing <url> with the exact link provided. Do not add any extra greeting or explanation when triggering the tool.`
        });
    }

    const response = await ollama.chat.completions.create({
        model: LOCAL_MODEL,
        messages: completeMessages,
    });

    return response.choices[0].message;
}