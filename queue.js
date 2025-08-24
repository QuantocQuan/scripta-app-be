import { Queue } from 'bullmq';
import IORedis from "ioredis";

const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // ✅ cần cho BullMQ
};
export const myQueue = new Queue('tasks', { connection });