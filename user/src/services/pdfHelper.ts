
import { pdfjs } from 'react-pdf';

// Reuse the same worker configuration to avoid conflicts
// Note: workerSrc is already set in Learning.tsx, but setting it here again ensures safety if this utility is used independently.
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export const extractTextFromPdf = async (url: string): Promise<{ page: number, text: string }[]> => {
    try {
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;

        const pages = [];
        const numPages = pdf.numPages;

        // Extract text from ALL pages.
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            pages.push({ page: i, text: pageText });
        }

        return pages;
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        return [];
    }
};
