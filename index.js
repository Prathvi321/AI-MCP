import readline from 'readline';
import { initializeChatSession } from './aiEngine.js';
import { executeQrCodeTool } from './tools.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log("🤖 Gemini Modular Bot Active! Chat normally, or ask for a QR code link.");
    
    const chat = initializeChatSession();

    const promptUser = () => {
        rl.question('\nYou: ', async (userInput) => {
            if (userInput.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            try {
                let response = await chat.sendMessage({ message: userInput });
                
                if (response.functionCalls && response.functionCalls.length > 0) {
                    const call = response.functionCalls[0];
                    
                    if (call.name === 'generateQrCode') {
                        console.log(`\n⚙️ [Tool Triggered] Launching tools.js handler...`);
                        
                        const toolResult = await executeQrCodeTool(call.args);
                        
                        if (toolResult.success) {
                            console.log("\n🎬 Generated QR Code Visual Payload (Base64 Output Recieved)");
                            
                            response = await chat.sendMessage({
                                message: [{
                                    functionResponse: {
                                        name: 'generateQrCode',
                                        response: { result: toolResult.message }
                                    }
                                }]
                            });
                            console.log(`\nAI: ${response.text}`);
                        } else {
                            console.log(`❌ Tool Error: ${toolResult.error}`);
                        }
                    }
                } else {
                    console.log(`\nAI: ${response.text}`);
                }
            } catch (err) {
                console.error("\n❌ Error handling request:", err.message);
            }
            
            promptUser();
        });
    };

    promptUser();
}

main();