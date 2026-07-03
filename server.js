import 'dotenv/config';
import express from 'express';
import { sendChatMessage } from './aiEngine.js';
import { executeQrCodeTool } from './qrTool.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Main conversation thread array stored dynamically in memory
let conversationHistory = [];

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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            body { display: flex; height: 100vh; background-color: #f9f9fb; color: #2d3748; }
            
            .sidebar { width: 280px; background-color: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 20px; justify-content: space-between; }
            .sidebar-title { font-size: 1.2rem; font-weight: 700; color: #1a202c; display: flex; align-items: center; gap: 8px; }
            .sidebar-title span { color: #3182ce; }
            .features-box { margin-top: 25px; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #edf2f7; }
            .features-title { font-size: 0.85rem; text-transform: uppercase; font-weight: 600; color: #718096; margin-bottom: 10px; }
            .feature-item { font-size: 0.85rem; color: #4a5568; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
            
            /* --- Client-Side Tool Box Style --- */
            .tool-card { margin-top: 20px; background: #ffffff; border: 1px dashed #cbd5e0; border-radius: 8px; padding: 12px; font-size: 0.85rem; }
            .tool-card input[type="file"] { display: none; }
            .upload-label-btn { display: block; text-align: center; background: #e2e8f0; padding: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 8px; transition: background 0.2s; }
            .upload-label-btn:hover { background: #cbd5e0; }
            .tool-options { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
            .tool-options input { width: 100%; padding: 6px; border: 1px solid #e2e8f0; border-radius: 4px; outline: none; }
            .tool-action-btn { background: #38a169; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
            .tool-action-btn:hover { background: #2f855a; }
            .tool-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

            .chat-container { display: flex; flex-direction: column; flex: 1; height: 100%; max-width: 900px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.02); }
            .header { padding: 16px 24px; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
            .header h1 { font-size: 1.1rem; font-weight: 600; color: #2d3748; }
            .badge-container { display: flex; gap: 8px; }
            .badge { font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; }
            .badge-speed { background-color: #ebf8ff; color: #2b6cb0; }
            .badge-power { background-color: #f0fff4; color: #276749; }

            .messages-box { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 24px; background-color: #fdfdfd; }
            .message { display: flex; gap: 16px; max-width: 85%; padding: 12px 16px; border-radius: 12px; line-height: 1.6; font-size: 0.95rem; }
            .user-msg { background-color: #edf2f7; align-self: flex-end; border-radius: 16px 16px 0px 16px; color: #1a202c; }
            .ai-msg { background-color: transparent; align-self: flex-start; padding-left: 0; color: #2d3748; }
            
            .avatar { width: 32px; height: 32px; border-radius: 50%; background-color: #3182ce; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; flex-shrink: 0; }
            .msg-body { display: flex; flex-direction: column; width: 100%; }
            .sender-label { font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; color: #718096; }
            
            .msg-text p { margin-bottom: 10px; }
            .msg-text ul, .msg-text ol { margin-left: 20px; margin-bottom: 10px; }
            .msg-text code { background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #e53e3e; }
            .msg-text pre { background-color: #1a202c; color: #edf2f7; padding: 14px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-family: monospace; }
            .msg-text pre code { background-color: transparent; padding: 0; color: inherit; }

            .qr-image { margin-top: 12px; max-width: 180px; border: 4px solid #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .input-wrapper { padding: 20px 24px 30px 24px; background: #ffffff; border-top: 1px solid #edf2f7; }
            .input-area { display: flex; gap: 12px; background: #f7fafc; padding: 10px 16px; border-radius: 24px; border: 1px solid #e2e8f0; align-items: center; }
            .input-area input { flex: 1; background: transparent; border: none; color: #2d3748; outline: none; font-size: 0.95rem; }
            .input-area button { background: #3182ce; color: #ffffff; border: none; padding: 8px 18px; border-radius: 18px; font-weight: 600; cursor: pointer; }
            
            .system-status { font-weight: 600; color: #dd6b20; font-size: 0.8rem; margin: 4px 0; }
            .footer-note { font-size: 0.75rem; text-align: center; color: #a0aec0; margin-top: 8px; }
        </style>
    </head>
    <body>
        <div class="sidebar">
            <div>
                <div class="sidebar-title">AI hai <span>Bhaisahab</span></div>
                
                <div class="features-box">
                    <div class="features-title">⚙️ Optimization Engine</div>
                    <div class="feature-item">⚡ <b>Edge Conversion</b> via Browser</div>
                    <div class="feature-item">🔋 <b>0% Server Power Used</b></div>
                    <div class="feature-item">🤖 Local Gemma Processing active</div>
                </div>

                <div class="tool-card">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #2d3748;">📁 High-Speed PDF Slicer</div>
                    <label for="pdfFile" class="upload-label-btn" id="uploadLabel">Select PDF File</label>
                    <input type="file" id="pdfFile" accept=".pdf" onchange="loadPdfInBrowser()">
                    
                    <div id="pdfToolControls" style="display: none;">
                        <div style="font-size: 11px; color: #718096; margin-bottom: 6px;" id="pdfMetaInfo">0 Pages detected</div>
                        <div class="tool-options">
                            <label style="font-size: 11px; font-weight: bold;">Page Settings:</label>
                            <input type="text" id="pageRangeInput" placeholder="e.g., 1,3,5 or leave blank for ALL">
                            <button class="tool-action-btn" id="sliceBtn" onclick="processPdfOnClient()">Extract Pages ZIP</button>
                        </div>
                    </div>
                </div>

            </div>
            <div class="feature-item" style="color: #a0aec0; font-size: 0.75rem;">v4.0.1 • Fixed Render Mode</div>
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
                        <div class="msg-text">Hello! I can answer questions, generate QR codes, or slice up PDFs right inside your browser session without touching server hardware. What are we building today?</div>
                    </div>
                </div>
            </div>
            <div class="input-wrapper">
                <div class="input-area">
                    <input type="text" id="userInput" placeholder="Ask anything, or ask to generate a QR code link..." onkeydown="if(event.key === 'Enter') sendMessage()">
                    <button onclick="sendMessage()">Send</button>
                </div>
                <div class="footer-note">AI hai Bhaisahab uses your device context to calculate data conversions instantly.</div>
            </div>
        </div>

        <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            let loadedPdfDoc = null;
            let loadedFileName = "";

            marked.setOptions({ breaks: true, gfm: true });

            // --- BROWSER-SIDE PDF READING ENGINE ---
            async function loadPdfInBrowser() {
                const fileInput = document.getElementById('pdfFile');
                if (fileInput.files.length === 0) return;

                const file = fileInput.files[0];
                loadedFileName = file.name;
                document.getElementById('uploadLabel').innerText = "🔄 Change PDF";
                
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    loadedPdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    
                    document.getElementById('pdfMetaInfo').innerText = \`📄 Loaded: \${loadedFileName} (\${loadedPdfDoc.numPages} Pages)\`;
                    document.getElementById('pdfToolControls').style.display = "block";
                } catch(err) {
                    alert("Failed to read PDF inside browser workspace: " + err.message);
                }
            }

            // --- PURE CLIENT-SIDE PDF RENDERING & ZIP GENERATOR ---
            async function processPdfOnClient() {
                if (!loadedPdfDoc) return;
                
                const sliceBtn = document.getElementById('sliceBtn');
                const pageInput = document.getElementById('pageRangeInput').value.trim();
                
                sliceBtn.disabled = true;
                sliceBtn.innerText = "Processing...";

                let targetPages = [];
                if (pageInput) {
                    targetPages = pageInput.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p >= 1 && p <= loadedPdfDoc.numPages);
                } else {
                    for(let i = 1; i <= loadedPdfDoc.numPages; i++) targetPages.push(i);
                }

                try {
                    const zip = new JSZip();
                    const folder = zip.folder("extracted_images");
                    const baseName = loadedFileName.replace(".pdf", "");

                    for (let i = 0; i < targetPages.length; i++) {
                        const pageNum = targetPages[i];
                        sliceBtn.innerText = \`Slicing Page \${pageNum}...\`;
                        
                        const page = await loadedPdfDoc.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 2.0 });
                        
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                        
                        const dataUrl = canvas.toDataURL('image/png');
                        const base64Content = dataUrl.split(',')[1];
                        
                        folder.file(\`\${baseName}_page_\${pageNum}.png\`, base64Content, { base64: true });
                    }

                    sliceBtn.innerText = "Packing ZIP File...";
                    const zipContent = await zip.generateAsync({ type: "blob" });
                    
                    const downloadUrl = URL.createObjectURL(zipContent);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = \`\${baseName}_extracted_images.zip\`;
                    link.click();

                    const chatBox = document.getElementById('chatBox');
                    chatBox.innerHTML += \`
                        <div class="message ai-msg">
                            <div class="avatar">AB</div>
                            <div class="msg-body">
                                <div class="sender-label">AI hai Bhaisahab</div>
                                <div class="system-status">⚡ [Client-Side offloading executed successfully]</div>
                                <div class="msg-text">Bhaisahab, your zip folder containing <b>\${targetPages.length} pages</b> converted into high-resolution images has been delivered via native pipeline processing context!</div>
                            </div>
                        </div>
                    \`;
                    chatBox.scrollTop = chatBox.scrollHeight;

                } catch(err) {
                    alert("Extraction crash: " + err.message);
                } finally {
                    sliceBtn.disabled = false;
                    sliceBtn.innerText = "Extract Pages ZIP";
                }
            }

            // --- REGULAR CHAT COMMUNICATIONS ENGINE ---
            async function sendMessage() {
                const inputEl = document.getElementById('userInput');
                const chatBox = document.getElementById('chatBox');
                const text = inputEl.value.trim();
                if(!text) return;

                inputEl.value = '';
                
                // FIXED INTERNAL STRIP-STRING TEMPLATE TO RENDER CLEAN INTERFACES
                const safeContent = escapeHtml(text);
                chatBox.innerHTML += \`
                    <div class="message user-msg">
                        <div class="msg-body">
                            <div class="sender-label" style="color: #4a5568; text-align: right;">You</div>
                            <div class="msg-text">\${safeContent}</div>
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
                    
                    if (!response.ok) throw new Error('Server Error');
                    
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
                    chatBox.innerHTML += \`<div class="message ai-msg"><div class="avatar" style="background-color: #e53e3e;">!</div><div class="msg-body"><div class="sender-label" style="color: #e53e3e;">System Error</div><div style="color: #e53e3e;">❌ Connection Error</div></div></div>\`;
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

// Post conversation gateway endpoint tracking text commands safely
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    let payload = { text: '', qrImage: null, toolTriggered: false };

    try {
        conversationHistory.push({ role: 'user', content: message });

        let aiResponse = await sendChatMessage(conversationHistory);
        let aiContent = aiResponse.content || '';

        if (aiContent.includes('TRIGGER_QR:')) {
            const urlStartIndex = aiContent.indexOf('TRIGGER_QR:') + 11;
            const urlEndIndex = aiContent.indexOf(']', urlStartIndex);
            
            if (urlStartIndex !== -1 && urlEndIndex !== -1) {
                let targetUrl = aiContent.substring(urlStartIndex, urlEndIndex).trim();
                if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

                payload.toolTriggered = true;
                const toolResult = await executeQrCodeTool({ url: targetUrl });
                
                if (toolResult.success) {
                    payload.qrImage = toolResult.output;
                    payload.text = `Bhaisahab, here is your requested QR code image for: ${targetUrl}`;
                    conversationHistory.push({ role: 'assistant', content: payload.text });
                }
            }
        } else {
            payload.text = aiContent;
            conversationHistory.push(aiResponse);
        }
        
        res.json(payload);
    } catch (err) {
        console.error("🔴 Local System Server Error Stack:", err);
        res.status(500).json({ text: `Internal Server Error: ${err.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 'AI hai Bhaisahab' Workspace operational at http://localhost:${PORT}`);
});