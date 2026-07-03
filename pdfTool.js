import pdfImgConvert from 'pdf-img-convert';
import AdmZip from 'adm-zip';
import path from 'path';

// tool declaration schema matching OpenAI/Ollama specs
export const pdfToImageZipTool = {
    type: 'function',
    function: {
        name: 'pdfToImageZip',
        description: 'Converts a PDF file buffer/path into a zip file filled with images of individual pages.',
        parameters: {
            type: 'object',
            properties: {
                filePath: { 
                    type: 'string', 
                    description: 'The internal server storage path of the uploaded PDF file.' 
                },
                pages: { 
                    type: 'array', 
                    items: { type: 'number' },
                    description: 'Optional array of specific page numbers to extract (e.g., [1, 3, 5]). If absent, extracts all pages.' 
                }
            },
            required: ['filePath'],
        }
    }
};

// native conversion utility execution mapping
export async function executePdfToImageZipTool(args) {
    try {
        const { filePath, pages } = args;
        
        const outputConfig = {
            width: 1200 // Sharp page rendering width dimensions
        };
        
        // If specific page boundaries are requested by the user
        if (pages && Array.isArray(pages) && pages.length > 0) {
            outputConfig.page_numbers = pages;
        }

        // Native conversion mapping logic loop
        const imageBuffers = await pdfImgConvert.convert(filePath, outputConfig);
        
        // Initialize the memory archiving compression block
        const zip = new AdmZip();
        const baseName = path.basename(filePath, path.extname(filePath));

        // Package rendered image buffers sequentially into files
        imageBuffers.forEach((buffer, index) => {
            const pageNum = (pages && pages[index]) ? pages[index] : (index + 1);
            zip.addFile(`${baseName}_page_${pageNum}.png`, buffer);
        });

        // Export data stream payload as base64 string
        const zipBuffer = zip.toBuffer();
        const zipBase64 = `data:application/zip;base64,${zipBuffer.toString('base64')}`;

        return {
            success: true,
            output: zipBase64,
            fileName: `${baseName}_extracted_pages.zip`,
            message: `Successfully converted ${imageBuffers.length} pages to a zip archive.`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}