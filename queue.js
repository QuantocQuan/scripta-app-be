import { Queue } from 'bullmq';

const connection = { host: process.env.REDIS_URL, port: process.env.REDIS_PORT };
export const myQueue = new Queue('tasks', { connection });