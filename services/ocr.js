import { ImageAnnotatorClient } from '@google-cloud/vision';
const keyJson = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'));

const visionClient = new ImageAnnotatorClient(
    { credentials: keyJson }
);

export async function imageToText(pathFile) {
    const [result] = await visionClient.textDetection({ image: { source: {filename:pathFile} } });
    const detections = result.textAnnotations || [];
    // textAnnotations[0] là full text; các phần tử sau là từng block/word
    const fullText = detections[0]?.description || '';
    return fullText.trim();
}