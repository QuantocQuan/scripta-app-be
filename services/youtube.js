import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import tmp from 'tmp';
import fs from 'fs';
import { speechToText } from './stt.js';

ffmpeg.setFfmpegPath(ffmpegPath);

export async function youtubeToText(url, languageCode = 'vi-VN') {
  if (!ytdl.validateURL(url)) {
    throw new Error('YouTube URL không hợp lệ');
  }

  // 1) Tải audio stream (m4a)
  const tmpOut = tmp.fileSync({ postfix: '.m4a' });
  await new Promise((resolve, reject) => {
    const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })
      .on('error', reject)
      .pipe(fs.createWriteStream(tmpOut.name))
      .on('finish', resolve)
      .on('error', reject);
  });

  // 2) Đọc file m4a thành buffer
  const audioBuffer = fs.readFileSync(tmpOut.name);
  tmpOut.removeCallback();

  // 3) Đưa qua STT
  const text = await speechToText(audioBuffer, languageCode);
  return text;
}