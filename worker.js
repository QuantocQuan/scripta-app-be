import { Worker } from 'bullmq';
import fs from 'fs';
import { speechToText } from './services/stt.js';
import { imageToText } from './services/ocr.js';
import { youtubeToText } from './services/youtube.js';

const connection = { host: '127.0.0.1', port: 6379 };

const worker = new Worker('tasks', async job => {
  console.log(`⚡ Nhận job: id=${job.id}, name=${job.name}, data=`, job.data);

  let result = null;
  try {
    if (job.name === 'stt') {
      console.log('👉 Đang xử lý STT...');
       const buffer = fs.readFileSync(job.data.filePath);
      result = await speechToText(buffer);
    } else if (job.name === 'ocr') {
      console.log('👉 Đang xử lý OCR...');
             const buffer = fs.readFileSync(job.data.filePath);

      result = await imageToText(buffer);
    } else if (job.name === 'youtube') {
      console.log('👉 Đang xử lý YouTube...');
      result = await youtubeToText(job.data.url);
    }

    fs.writeFileSync(`./results/${job.id}.json`, JSON.stringify({ result }, null, 2));
    console.log(`✅ Kết quả đã lưu vào ./results/${job.id}.json`);
    return result;
  } catch (err) {
    console.error(`❌ Lỗi khi xử lý job ${job.id}:`, err);
    throw err;
  }
}, { connection });

// Khi job hoàn thành
worker.on('completed', job => console.log(`🎉 Job ${job.id} completed`));

// Khi job thất bại
worker.on('failed', (job, err) => console.log(`💥 Job ${job.id} failed: ${err.message}`));

// Thêm log khi Worker sẵn sàng và kết nối Redis thành công
worker.on('ready', () => console.log('✅ Worker đã kết nối Redis thành công và sẵn sàng nhận job'));

// Thêm log khi Worker mất kết nối Redis
worker.on('error', (err) => console.error('❌ Worker gặp lỗi kết nối Redis:', err));
