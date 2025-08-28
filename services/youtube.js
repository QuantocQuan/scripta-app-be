import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import tmp from 'tmp';
import fs from 'fs';
import { speechToText } from './stt.js';

ffmpeg.setFfmpegPath(ffmpegPath);


// Hàm tải audio từ YouTube và lưu tạm
async function downloadYoutubeAudio(url) {
  const tmpFile = tmp.fileSync({ postfix: ".mp4" }); // file tạm
  await new Promise((resolve, reject) => {
    ytdl(url, { filter: "audioonly" })
      .pipe(fs.createWriteStream(tmpFile.name))
      .on("finish", resolve)
      .on("error", reject);
  });
  return tmpFile.name; // trả về path file tạm
}
export async function youtubeToText(url) {
  if (!ytdl.validateURL(url)) {
    throw new Error('YouTube URL không hợp lệ');
  }
  const pathFile = downloadYoutubeAudio(url);
  const text = await speechToText(pathFile);
  return text;
}