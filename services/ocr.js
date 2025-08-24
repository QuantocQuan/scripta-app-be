import { ImageAnnotatorClient } from '@google-cloud/vision';

const visionClient = new ImageAnnotatorClient(
    {
        keyFilename: "./configs/stt-ocr-app-68c4d2b7ddb5.json"
    }
);

export async function imageToText(buffer) {
    const [result] = await visionClient.textDetection({ image: { content: buffer } });
    const detections = result.textAnnotations || [];
    // textAnnotations[0] là full text; các phần tử sau là từng block/word
    const fullText = detections[0]?.description || '';
    return fullText.trim();
}