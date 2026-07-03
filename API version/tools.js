import { Type } from '@google/genai';
import QRCode from 'qrcode';

export const generateQrCodeTool = {
    name: 'generateQrCode',
    description: 'Generates a visual QR code image from a given URL string.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            url: {
                type: Type.STRING,
                description: 'The exact URL link to turn into a QR code (e.g., https://google.com).',
            },
        },
        required: ['url'],
    },
};

export async function executeQrCodeTool(args) {
    try {
        const { url } = args;
        // Generates a base64 image data URI string
        const qrImageBytes = await QRCode.toDataURL(url);
        return {
            success: true,
            output: qrImageBytes, 
            message: `QR code image successfully drawn for ${url}`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}