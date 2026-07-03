import QRCode from 'qrcode';

// Tool declaration schema matching OpenAI / Ollama specifications
export const generateQrCodeTool = {
    type: 'function',
    function: {
        name: 'generateQrCode',
        description: 'Generates a visual QR code image from a given URL string.',
        parameters: {
            type: 'object',
            properties: {
                url: { 
                    type: 'string', 
                    description: 'The exact URL link to turn into a QR code (e.g., https://google.com).' 
                },
            },
            required: ['url'],
        },
    }
};

// High-speed native utility execution mapping
export async function executeQrCodeTool(args) {
    try {
        const { url } = args;
        // Generates a local base64 image data URI string natively
        const qrImageBytes = await QRCode.toDataURL(url);
        return { 
            success: true, 
            output: qrImageBytes, 
            message: `QR code image drawn for ${url}` 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}