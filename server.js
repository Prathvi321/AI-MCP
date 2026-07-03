import 'dotenv/config';
import express from 'express';
import { sendChatMessage } from './aiEngine.js';
import { executeQrCodeTool } from './qrTool.js';

const app = express();
const PORT = 3000;

app.use(express.json());

let conversationHistory = [];

app.get('/favicon.ico', (req, res) => res.status(204).end());

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
            .msg-text code { background-color: #edf2f7; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #e53e3e; }
            .msg-text pre { background-color: #1a202c; color: #edf2f7; padding: 14px; border-radius: 8px; overflow-x: auto; margin: 12px 0; font-family: monospace; }

            .file-badge { background: #feebc8; color: #c05621; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: bold; margin-bottom: 8px; width: fit-content; }
            .qr-image { margin-top: 12px; max-width: 180px; border: 4px solid #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .input-wrapper { padding: 20px 24px 30px 24px; background: #ffffff; border-top: 1px solid #edf2f7; }
            .input-area { display: flex; gap: 12px; background: #f7fafc; padding: 10px 16px; border-radius: 24px; border: 1px solid #e2e8f0; align-items: center; }
            
            .file-upload-btn { cursor: pointer; color: #718096; font-size: 1.3rem; transition: color 0.2s; padding: 0 4px; user-select: none; }
            .file-upload-btn:hover { color: #3182ce; }
            .file-upload-btn.active { color: #38a169; }
            #pdfFileInput { display: none; }

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
                    <div class="feature-item">⚡ <b>Hybrid AI Intercept</b></div>
                    <div class="feature-item">🔋 <b>Device-Side Slicing</b></div>
                    <div class="feature-item">🤖 Local Gemma Processing active</div>
                </div>
            </div>
            <div class="feature-item" style="color: #a0aec0; font-size: 0.75rem;">v5.0.0 • Interactive AI Agent</div>
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
                        <div class="msg-text">Hello! Click the paperclip icon to select a PDF, and tell me: *"Extract pages 1, 2, 4"* or *"Extract all pages"*. I'll handle the parsing and zip it up right away!</div>
                    </div>
                </div>
            </div>
            <div class="input-wrapper">
                <div id="attachedFileBadge" style="display:none;"></div>
                <div class="input-area">
                    <label for="pdfFileInput" class="file-upload-btn" id="clipIcon" title="Attach PDF File">📎</label>
                    <input type="file" id="pdfFileInput" accept=".pdf" onchange="registerPdfFile()">
                    <input type="text" id="userInput" placeholder="Ask anything, or ask to extract PDF ranges..." onkeydown="if(event.key === 'Enter') sendMessage()">
                    <button onclick="sendMessage()">Send</button>
                </div>
                <div class="footer-note">AI hai Bhaisahab safely processes data containers locally inside your browser window.</div>
            </div>
        </div>

        <script>
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            let currentPdfFile = null;
            let currentPdfDoc = null;

            function registerPdfFile() {
                const input = document.getElementById('pdfFileInput');
                if(input.files.length === 0) return;
                
                currentPdfFile = input.files[0];
                document.getElementById('clipIcon').classList.add('active');
                
                const badge = document.getElementById('attachedFileBadge');
                badge.className = "file-badge";
                badge.innerHTML = \`📄 \${currentPdfFile.name} attached successfully\`;
                badge.style.display = "block";

                // Warm up the reader stream layers instantly
                const fileReader = new FileReader();
                fileReader.onload = async function() {
                    const typedarray = new Uint8Array(this.result);
                    currentPdfDoc = await pdfjsLib.getDocument({data: typedarray}).promise;
                };
                fileReader.readAsArrayBuffer(currentPdfFile);
            }

            async function processPdfExtraction(pagesArray) {
                if (!currentPdfDoc || !currentPdfFile) return "No active document layer found.";
                
                const zip = new JSZip();
                const folder = zip.folder("extracted_images");
                const baseName = currentPdfFile.name.replace(".pdf", "");
                
                let targetPages = [...pagesArray];
                if (targetPages.length === 0) {
                    for(let i = 1; i <= currentPdfDoc.numPages; i++) targetPages.push(i);
                }

                for(let pageNum of targetPages) {
                    if (pageNum < 1 || pageNum > currentPdfDoc.numPages) continue;
                    
                    const page = await currentPdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                    const dataUrl = canvas.toDataURL('image/png');
                    folder.file(\`\${baseName}_page_\${pageNum}.png\`, dataUrl.split(',')[1], {base64: true});
                }

                const blob = await zip.generateAsync({type: "blob"});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = \`\${baseName}_extracted.zip\`;
                link.click();
                
                return \`Successfully sliced \${targetPages.length} pages into **\${baseName}_extracted.zip**.\`;
            }

            async function sendMessage() {
                const inputEl = document.getElementById('userInput');
                const chatBox = document.getElementById('chatBox');
                const text = inputEl.value.trim();
                if(!text) return;

                inputEl.value = '';
                const safeContent = escapeHtml(text);
                
                chatBox.innerHTML += \`
                    <div class="message user-msg">
                        <div class="msg-body">
                            <div class="sender-label" style="text-align: right;">You</div>
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
                    
                    const data = await response.json();
                    let aiMessageHtml = \`<div class="message ai-msg"><div class="avatar">AB</div><div class="msg-body"><div class="sender-label">AI hai Bhaisahab</div>\`;
                    
                    if(data.text.includes('TRIGGER_PDF_ZIP:')) {
                        aiMessageHtml += \`<div class="system-status">⚡ [AI Intent Intercepted] Offloading Slicing to Device Browser Engine...</div>\`;
                        
                        const pagesMatch = data.text.match(/pages=\\\[([^\\\]]*)\\\]/i);
                        let pageNumbers = [];
                        if (pagesMatch && pagesMatch[1].trim()) {
                            pageNumbers = pagesMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                        }
                        
                        if(currentPdfDoc) {
                            const summaryText = await processPdfExtraction(pageNumbers);
                            aiMessageHtml += \`<div class="msg-text">\${marked.parse(summaryText)}</div>\`;
                            
                            // Reset file parameters post execution
                            currentPdfDoc = null;
                            currentPdfFile = null;
                            document.getElementById('clipIcon').classList.remove('active');
                            document.getElementById('attachedFileBadge').style.display = "none";
                            document.getElementById('pdfFileInput').value = '';
                        } else {
                            aiMessageHtml += \`<div class="msg-text" style="color:red;">Bhaisahab, you told me to extract pages but forgot to upload the PDF file using the paperclip button first!</div>\`;
                        }
                    } 
                    else if (data.text.includes('TRIGGER_QR:')) {
                        aiMessageHtml += \`<div class="system-status">⚡ [Tool Activated] Rendered Local QR Node</div>\`;
                        aiMessageHtml += \`<div class="msg-text">\${marked.parse(data.responseText)}</div>\`;
                        if(data.qrImage) aiMessageHtml += \`<img src="\${data.qrImage}" class="qr-image" />\`;
                    }
                    else {
                        aiMessageHtml += \`<div class="msg-text">\${marked.parse(data.text)}</div>\`;
                    }
                    
                    aiMessageHtml += \`</div></div>\`;
                    chatBox.innerHTML += aiMessageHtml;
                    
                } catch(err) {
                    aiMessageHtml += \`<div class="message ai-msg"><div class="avatar" style="background:red;">!</div><div class="msg-body"><div style="color:red;">❌ Communication Failure</div></div></div>\`;
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

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    let payload = { text: '', responseText: '', qrImage: null };

    try {
        conversationHistory.push({ role: 'user', content: message });
        let aiResponse = await sendChatMessage(conversationHistory);
        let aiContent = aiResponse.content || '';

        // Capture PDF instructions text tags
        if (aiContent.includes('TRIGGER_PDF_ZIP:')) {
            payload.text = aiContent; 
            conversationHistory.push({ role: 'assistant', content: "Processed PDF slice execution sequence request." });
        } 
        // Capture QR code generator instructions tags
        else if (aiContent.includes('TRIGGER_QR:')) {
            const urlStartIndex = aiContent.indexOf('TRIGGER_QR:') + 11;
            const urlEndIndex = aiContent.indexOf(']', urlStartIndex);
            if (urlStartIndex !== -1 && urlEndIndex !== -1) {
                let targetUrl = aiContent.substring(urlStartIndex, urlEndIndex).trim();
                if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
                
                const toolResult = await executeQrCodeTool({ url: targetUrl });
                payload.text = aiContent;
                payload.qrImage = toolResult.output;
                payload.responseText = `Bhaisahab, here is your requested QR code image for: ${targetUrl}`;
                conversationHistory.push({ role: 'assistant', content: payload.responseText });
            }
        } 
        else {
            payload.text = aiContent;
            conversationHistory.push(aiResponse);
        }
        res.json(payload);
    } catch (err) {
        console.error("🔴 Server routing error:", err);
        res.status(500).json({ text: `Internal Error: ${err.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 'AI hai Bhaisahab' Workspace running at http://localhost:${PORT}`);
});
