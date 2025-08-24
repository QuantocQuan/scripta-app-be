import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import tmp from 'tmp';
import fs from 'fs';
import { SpeechClient } from '@google-cloud/speech';

ffmpeg.setFfmpegPath(ffmpegPath);
const keyJson = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8'));

const speechClient = new SpeechClient({ credentials: keyJson });

// Chuẩn hoá audio về LINEAR16 16kHz mono để STT ổn định
async function transcodeToWavMono16k(buffer) {
  const tmpIn = tmp.fileSync({ postfix: '.input' });
  const tmpOut = tmp.fileSync({ postfix: '.wav' });
  fs.writeFileSync(tmpIn.name, buffer);

  await new Promise((resolve, reject) => {
    ffmpeg(tmpIn.name)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', resolve)
      .save(tmpOut.name);
  });

  const wav = fs.readFileSync(tmpOut.name);
  tmpIn.removeCallback();
  tmpOut.removeCallback();
  return wav;
}

export async function speechToText(fileBuffer, languageCode = process.env.DEFAULT_STT_LANG || 'vi-VN') {
  const wav = await transcodeToWavMono16k(fileBuffer);

  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'latest_long', // hoặc 'default'
    },
    audio: {
      content: wav.toString('base64'),
    },
  };

  const [response] = await speechClient.recognize(request);
  const transcription = response.results
    ?.map(r => r.alternatives?.[0]?.transcript || '')
    .join('\n')
    .trim();
  return transcription || '';
}