import express from 'express';
import multer from 'multer';
import { myQueue } from './queue.js';
import 'dotenv/config';
import setupSwagger from './swagger.js';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());
setupSwagger(app);
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /api/stt:
 *   post:
 *     summary: Upload file để chuyển giọng nói thành text
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Trả về taskId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 */
app.post('/api/stt', upload.single('file'), async (req, res) => {
  const job = await myQueue.add('stt', { filePath: req.file.path });
  res.json({ taskId: job.id });
});

/**
 * @swagger
 * /api/ocr:
 *   post:
 *     summary: Upload file để OCR
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Trả về taskId
 */
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  const job = await myQueue.add('ocr', { filePath: req.file.path });
  res.json({ taskId: job.id });
});

/**
 * @swagger
 * /api/youtube:
 *   post:
 *     summary: Thêm job xử lý YouTube URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về taskId
 */
app.post('/api/youtube', async (req, res) => {
  const { url } = req.body;
  const job = await myQueue.add('youtube', { url });
  res.json({ taskId: job.id });
});

/**
 * @swagger
 * /api/status/{id}:
 *   get:
 *     summary: Lấy trạng thái job
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của task
 *     responses:
 *       200:
 *         description: Trả về trạng thái và kết quả
 */

app.get('/api/status/:id', async (req, res) => {
  const job = await myQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Task not found' });
  const state = await job.getState();
  let result = null;
  try {
    result = job.returnvalue;
  } catch { }
  res.json({ id: job.id, state, result });
});

app.listen(process.env.PORT || 3000, () => console.log(`Server running on http://localhost:${process.env.PORT || 3000}`));