import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import tmp from 'tmp';
import fs from 'fs';
import { SpeechClient } from '@google-cloud/speech';

ffmpeg.setFfmpegPath(ffmpegPath);
const keyJson = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'));

const speechClient = new SpeechClient({ credentials: keyJson });

// Chuẩn hoá audio về LINEAR16 16kHz mono để STT ổn định
async function transcodeToWavMono16k(inputPath) {
  const tmpOut = tmp.fileSync({ postfix: '.wav' });

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', resolve)
      .save(tmpOut.name);
  });

  const wav = fs.readFileSync(tmpOut.name);
  tmpOut.removeCallback();
  console.log("wav file", wav);
  return wav;
}

export async function speechToText(inputPath, languageCode = process.env.DEFAULT_STT_LANG || 'vi-VN') {
  const wav = await transcodeToWavMono16k(inputPath);

  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'default', // hoặc 'default'
    },
    audio: {
      content: wav.toString('base64'),
    },
  };


  try {
    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();

    // Log toàn bộ response để debug
    console.log("📄 Raw STT response:", JSON.stringify(response, null, 2));

    if (!response.results || response.results.length === 0) {
      console.warn("⚠️ Không có transcript trong response");
      return '';
    }

    const transcription = response.results
      .map(r =>
        r.alternatives && r.alternatives.length > 0
          ? r.alternatives[0].transcript
          : ''
      )
      .filter(Boolean)
      .join('\n')
      .trim();

    return transcription || '';
  } catch (err) {
    console.error("❌ Lỗi khi gọi Google STT:", err);
    throw err;
  }
}