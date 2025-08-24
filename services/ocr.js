import { ImageAnnotatorClient } from '@google-cloud/vision';
const keyJson = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf-8'));

const visionClient = new ImageAnnotatorClient(
    { credentials: keyJson }
);

export async function imageToText(buffer) {
    const [result] = await visionClient.textDetection({ image: { content: buffer } });
    const detections = result.textAnnotations || [];
    // textAnnotations[0] là full text; các phần tử sau là từng block/word
    const fullText = detections[0]?.description || '';
    return fullText.trim();
}