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
            
            CRITICAL INTERCEPTION RULE:
            1. If the user explicitly asks you to generate a QR code from a URL, reply EXACTLY with: "[TRIGGER_QR: <url>]".
            2. If the user asks you to extract specific pages, a page range, or all pages from a PDF document, you must determine what pages they want. Then reply EXACTLY with: "[TRIGGER_PDF_ZIP: pages=[<page_numbers>]]"
               - Replace <page_numbers> with a comma-separated list of the requested numbers (e.g., pages=[1,2,3] or pages=[5,6,7,8]).
               - If they want the whole file or don't specify numbers, reply with pages=[] empty.
            
            Do not add greetings, pleasantries, or extra sentences when triggering these tools.`
        });
    }

    const response = await ollama.chat.completions.create({
        model: LOCAL_MODEL,
        messages: completeMessages,
    });

    return response.choices[0].message;
}
