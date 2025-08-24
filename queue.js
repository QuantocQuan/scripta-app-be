import { Queue } from 'bullmq';

const connection = { host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD};
export const myQueue = new Queue('tasks', { connection });