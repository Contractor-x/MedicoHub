import { YoutubeTranscript } from 'youtube-transcript';
const pdf = require('pdf-parse');
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const extractTextFromPDF = async (pdfUrl: string): Promise<string> => {
    try {
        console.log(`Extracting text from PDF: ${pdfUrl}`);
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const options = {
            pagerender: async function (pageData: any) {
                const render_options = {
                    normalizeWhitespace: true,
                    disableCombineTextItems: false
                };
                const textContent = await pageData.getTextContent(render_options);
                let lastY, text = '';
                for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY) {
                        text += item.str;
                    }
                    else {
                        text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                }
                return `\n\n--- Page ${pageData.pageNumber} ---\n${text}`;
            }
        };
        const data = await pdf(buffer, options);
        // data.text is the extracted text
        // Clean it up slightly (remove excessive newlines)
        return data.text.substring(0, 150000); // Increased limit to 150k for larger docs
    } catch (error) {
        console.error('PDF Extraction Failed:', error);
        return "";
    }
};

export const extractTextFromYouTube = async (videoUrl: string): Promise<string> => {
    try {
        console.log(`Extracting transcripts from Video: ${videoUrl}`);
        // Extract Video ID
        // Supports formats: youtu.be/ID, youtube.com/watch?v=ID
        let videoId = "";
        if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (videoUrl.includes('v=')) {
            videoId = videoUrl.split('v=')[1].split('&')[0];
        }

        if (!videoId) return "";

        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        console.error('YouTube Transcript Failed:', error);
        return "";
    }
};
