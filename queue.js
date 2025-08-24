import { Queue } from 'bullmq';
import IORedis from "ioredis";

// Tạo connection Redis
const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined, // Railway Redis thường yêu cầu TLS,
    maxRetriesPerRequest: null,
});
export const myQueue = new Queue('tasks', { connection });