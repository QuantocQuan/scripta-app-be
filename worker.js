import { Worker } from "bullmq";
import IORedis from "ioredis";
import { speechToText } from "./services/stt.js";
import { imageToText } from "./services/ocr.js";
import { youtubeToText } from "./services/youtube.js";
import axios from "axios";
import { PassThrough } from "stream";
import admin from 'firebase-admin';
import fs from "fs";
import tmp from "tmp";
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8')))
});
const db = admin.firestore();

async function saveResult(userId, taskId, result, error = null) {
  const taskRef = db
    .collection("results")
    .doc(userId)
    .collection("tasks")
    .doc(taskId);

  await taskRef.set({
    result,
  });
}
function trimQuotes(str) {
  return str.replace(/^'+|'+$/g, "");
}
const worker = new Worker(
  "tasks",
  async job => {
    console.log(`⚡ Nhận job: id=${job.id}, name=${job.name}, data=`, job.data);

    let result = null;
    try {
      if (job.name === "stt") {
        console.log("👉 Đang xử lý STT...");
        const url = job.data.filePath
        // tạo file tạm (sẽ tự xóa sau khi close nếu muốn)
        const tmpFile = tmp.fileSync({ postfix: ".wav" });
        const writer = fs.createWriteStream(tmpFile.name);

        const response = await axios({ url, method: "GET", responseType: "stream" });

        response.data.pipe(writer);

        // đợi ghi xong
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
        result = await speechToText(tmpFile.name);
      }
      // else if (job.name === "ocr") {
      //   console.log("👉 Đang xử lý OCR...");
      //   const buffer = fs.readFileSync(job.data.filePath);
      //   result = await imageToText(buffer);
      // } else if (job.name === "youtube") {
      //   console.log("👉 Đang xử lý YouTube...");
      //   result = await youtubeToText(job.data.url);
      // }
      console.log(result);
      await saveResult("123", job.id, result);

      return result;
    } catch (err) {
      console.error(`❌ Lỗi khi xử lý job ${job.id}:`, err);
      await saveResult("123", job.id, result);
      throw err;
    }
  },
  { connection }
);

// Khi job hoàn thành
worker.on("completed", job => console.log(`🎉 Job ${job.id} completed`));

// Khi job thất bại
worker.on("failed", (job, err) =>
  console.log(`💥 Job ${job.id} failed: ${err.message}`)
);

// Khi Worker sẵn sàng
worker.on("ready", () =>
  console.log("✅ Worker đã kết nối Redis thành công và sẵn sàng nhận job")
);

// Khi Worker mất kết nối Redis
worker.on("error", err =>
  console.error("❌ Worker gặp lỗi kết nối Redis:", err)
);
