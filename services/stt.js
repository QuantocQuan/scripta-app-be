import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import tmp from 'tmp';
import fs from 'fs';
import { SpeechClient } from '@google-cloud/speech';

ffmpeg.setFfmpegPath(ffmpegPath);

const keyJson = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'));
const speechClient = new SpeechClient({ credentials: keyJson });

// 1️⃣ Tách audio dài thành các chunk ≤ chunkSeconds
async function splitAudioToChunks(inputPath, chunkSeconds = 50) {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const outputPattern = `${tmpDir.name}/chunk_%03d.wav`;

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .outputOptions([
        '-f segment',
        `-segment_time ${chunkSeconds}`,
        '-reset_timestamps 1'
      ])
      .on('end', resolve)
      .on('error', reject)
      .save(outputPattern);
  });

  // Lấy danh sách file chunk
  const files = fs.readdirSync(tmpDir.name)
    .filter(f => f.endsWith('.wav'))
    .map(f => `${tmpDir.name}/${f}`);

  return { files, tmpDir };
}

// 2️⃣ Gọi Google STT cho 1 chunk
async function recognizeChunk(filePath, languageCode = 'vi-VN') {
  const wav = fs.readFileSync(filePath);
  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode,
      enableAutomaticPunctuation: true,
    },
    audio: { content: wav.toString('base64') },
  };

  const [response] = await speechClient.recognize(request);
  return response.results
    .map(r => r.alternatives?.[0]?.transcript || '')
    .filter(Boolean)
    .join('\n');
}

// 3️⃣ Hàm chính xử lý audio dài
export async function speechToText(inputPath, languageCode = 'vi-VN') {
  const { files, tmpDir } = await splitAudioToChunks(inputPath, 50);

  let fullTranscript = '';
  for (const f of files) {
    console.log(`👉 Xử lý chunk: ${f}`);
    const text = await recognizeChunk(f, languageCode);
    fullTranscript += text + '\n';
  }

  tmpDir.removeCallback(); // xóa tmp
  return fullTranscript.trim();
}
