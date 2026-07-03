import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeChatSession } from './aiEngine.js';
import { executeQrCodeTool } from './tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Create the cloud chat session
const chat = initializeChatSession();

// Silence the automatic 404 favicon error in web browsers
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve the frontend interface markup
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI hai Bhaisahab - Workspace</title>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            body { display: flex; height: 100vh; background-color: #f9f9fb; color: #2d3748; }
            
            .sidebar { width: 260px; background-color: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 20px; justify-content: space-between; }
            .sidebar-title { font-size: 1.2rem; font-weight: 700; color: #1a202c; display: flex; align-items: center; gap: 8px; }
            .sidebar-title span { color: #3182ce; }
            .features-box { margin-top: 30px; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #edf2f7; }
            .features-title { font-size: 0.85rem; text-transform: uppercase; font-weight: 600; color: #718096; margin-bottom: 10px; letter-spacing: 0.5px; }
            .feature-item { font-size: 0.85rem; color: #4a5568; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
            
            .chat-container { display: flex; flex-direction: column; flex: 1; height: 100%; max-width: 1000px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.02); }
            .header { padding: 16px 24px; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
            .header h1 { font-size: 1.1rem; font-weight: 600; color: #2d3748; }
            .badge-container { display: flex; gap: 8px; }
            .badge { font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; }
            .badge-speed { background-color: #ebf8ff; color: #2b6cb0; }
            .badge-power { background-color: #f0fff4; color: #276749; }

            .messages-box { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; background-color: #fdfdfd; }
            .message { display: flex; gap: 16px; max-width: 85%; padding: 12px 16px; border-radius: 12px; line-height: 1.6; font-size: 0.95rem; }
            .user-msg { background-color: #edf2f7; align-self: flex-end; border-radius: 16px 16px 0px 16px; color: #1a202c; }
            .ai-msg { background-color: transparent; align-self: flex-start; padding-left: 0; color: #2d3748; }
            
            .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #3182ce; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; flex-shrink: 0; }
            .msg-body { display: flex; flex-direction: column; width: 100%; }
            .sender-label { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; color: #718096; }
            
            /* Clean Markdown Rendering Styles */
            .msg-text p { margin-bottom: 10px; }
            .msg-text ul, .msg-text ol { margin-left: 20px; margin-bottom: 10px; }
            .msg-text code { background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #e53e3e; }
            .msg-text pre { background-color: #1a202c; color: #edf2f7; padding: 14px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-family: monospace; font-size: 0.9em; }
            .msg-text pre code { background-color: transparent; padding: 0; color: inherit; }

            .qr-image { margin-top: 12px; max-width: 180px; border: 4px solid #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .input-wrapper { padding: 20px 24px 30px 24px; background: #ffffff; border-top: 1px solid #edf2f7; }
            .input-area { display: flex; gap: 12px; background: #f7fafc; padding: 10px 16px; border-radius: 24px; border: 1px solid #e2e8f0; align-items: center; transition: border 0.2s; }
            .input-area:focus-within { border-color: #3182ce; background: #ffffff; box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15); }
            .input-area input { flex: 1; background: transparent; border: none; color: #2d3748; outline: none; font-size: 0.95rem; }
            .input-area button { background: #3182ce; color: #ffffff; border: none; padding: 8px 18px; border-radius: 18px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 0.85rem; }
            .input-area button:hover { background: #2b6cb0; }
            
            .system-status { font-weight: 600; color: #dd6b20; font-size: 0.8rem; margin: 4px 0; display: flex; align-items: center; gap: 4px; }
            .footer-note { font-size: 0.75rem; text-align: center; color: #a0aec0; margin-top: 8px; }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <div>
                <div class="sidebar-title">AI hai <span>Bhaisahab</span></div>
                <div class="features-box">
                    <div class="features-title">⚙️ Optimization Engine</div>
                    <div class="feature-item">⚡ <b>Fast execution</b> via Native Tools</div>
                    <div class="feature-item">🔋 <b>Low-power consumption</b></div>
                    <div class="feature-item">☁️ Gemini Cloud Processing active</div>
                </div>
            </div>
            <div class="feature-item" style="color: #a0aec0; font-size: 0.75rem;">v2.2.0 • Gemini Cloud Mode</div>
        </div>

        <div class="chat-container">
            <div class="header">
                <h1>Conversational Engine</h1>
                <div class="badge-container">
                    <span class="badge badge-speed">⚡ Hyper-Fast Tasks</span>
                    <span class="badge badge-power">🔋 Low Energy Mode</span>
                </div>
            </div>
            <div class="messages-box" id="chatBox">
                <div class="message ai-msg">
                    <div class="avatar">AB</div>
                    <div class="msg-body">
                        <div class="sender-label">AI hai Bhaisahab</div>
                        <div class="msg-text">Hello! I am your cloud AI assistant, backed by standard processing capabilities and high-efficiency tactical tools to get tasks done faster while saving system power. What can I do for you today?</div>
                    </div>
                </div>
            </div>
            <div class="input-wrapper">
                <div class="input-area">
                    <input type="text" id="userInput" placeholder="Ask anything, or ask to generate a QR code link..." onkeydown="if(event.key === 'Enter') sendMessage()">
                    <button onclick="sendMessage()">Send</button>
                </div>
                <div class="footer-note">AI hai Bhaisahab may display optimization notifications when processing dedicated tools.</div>
            </div>
        </div>

        <script>
            marked.setOptions({
                breaks: true,
                gfm: true
            });

            async function sendMessage() {
                const inputEl = document.getElementById('userInput');
                const chatBox = document.getElementById('chatBox');
                const text = inputEl.value.trim();
                if(!text) return;

                inputEl.value = '';
                chatBox.innerHTML += \`
                    <div class="message user-msg">
                        <div class="msg-body">
                            <div class="sender-label" style="color: #4a5568; text-align: right;">You</div>
                            <div class="msg-text">\${escapeHtml(text)}</div>
                        </div>
                    </div>
                \`;
                chatBox.scrollTop = chatBox.scrollHeight;

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text })
                    });
                    
                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.text || 'Server Error');
                    }
                    
                    const data = await response.json();
                    let aiMessageHtml = \`
                        <div class="message ai-msg">
                            <div class="avatar">AB</div>
                            <div class="msg-body">
                                <div class="sender-label">AI hai Bhaisahab</div>
                    \`;
                    
                    if(data.toolTriggered) {
                        aiMessageHtml += \`<div class="system-status">⚡ [Tool Activated] Task offloaded natively (Saved Power & Time)</div>\`;
                    }
                    
                    const parsedMarkdownContent = marked.parse(data.text);
                    aiMessageHtml += \`<div class="msg-text">\${parsedMarkdownContent}</div>\`;
                    
                    if(data.qrImage) {
                        aiMessageHtml += \`<img src="\${data.qrImage}" class="qr-image" alt="QR Code" />\`;
                    }
                    
                    aiMessageHtml += \`</div></div>\`;
                    chatBox.innerHTML += aiMessageHtml;
                    
                } catch(err) {
                    chatBox.innerHTML += \`
                        <div class="message ai-msg">
                            <div class="avatar" style="background-color: #e53e3e;">!</div>
                            <div class="msg-body">
                                <div class="sender-label" style="color: #e53e3e;">System Error</div>
                                <div style="color: #e53e3e;">❌ Connection Error: \${err.message}</div>
                            </div>
                        </div>
                    \`;
                }
                chatBox.scrollTop = chatBox.scrollHeight;
            }

            function escapeHtml(text) {
                return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            }
        </script>
    </body>
    </html>
    `);
});

// Route handling conversation and cloud native tool execution logic
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    let payload = { text: '', qrImage: null, toolTriggered: false };

    try {
        let response = await chat.sendMessage({ message: message });

        // Tool orchestration loop checks
        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            
            if (call.name === 'generateQrCode') {
                payload.toolTriggered = true;
                const toolResult = await executeQrCodeTool(call.args);
                
                if (toolResult.success) {
                    payload.qrImage = toolResult.output;
                    
                    // Respond back execution result report to cloud model context
                    response = await chat.sendMessage({
                        message: [{
                            functionResponse: {
                                name: 'generateQrCode',
                                response: { result: toolResult.message }
                            }
                        }]
                    });
                    payload.text = response.text;
                } else {
                    payload.text = `Tool Execution failed: ${toolResult.error}`;
                }
            }
        } else {
            payload.text = response.text;
        }
        res.json(payload);
    } catch (err) {
        console.error("🔴 Express Endpoint Error Stack:", err);
        
        // Catch daily free tier quota limitations safely
        if (err.status === 429 || (err.message && err.message.includes('quota'))) {
            return res.status(429).json({ 
                text: "Bhaisahab, API Quota khatam ho gayi hai! (Daily free tier limit exceeded). Please upgrade your billing plan or wait a bit to refresh token slots." 
            });
        }
        
        res.status(500).json({ text: `Internal Server Error: ${err.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 'AI hai Bhaisahab' Cloud Interface is live at http://localhost:${PORT}`);
});