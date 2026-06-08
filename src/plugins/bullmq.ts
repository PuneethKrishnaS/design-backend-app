import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const bullmqPlugin: Plugin = {
  name: 'bullmq',
  dependencies: {
    'bullmq': '^5.7.8',
  },
  execute: async (context: PluginContext) => {
    const { targetDir } = context;

    const configDir = path.join(targetDir, 'src', 'config');
    await fs.ensureDir(configDir);
    
    // We assume Redis plugin will also run and provide process.env.REDIS_URL
    await fs.writeFile(path.join(configDir, 'queue.ts'), `import { Queue, Worker, QueueEvents, Job } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const createQueue = (queueName: string) => {
  return new Queue(queueName, { connection });
};

export const createWorker = (queueName: string, processor: (job: Job) => Promise<any>) => {
  const worker = new Worker(queueName, processor, { connection });
  
  worker.on('completed', (job) => {
    console.log(\`Job \${job.id} has completed!\`);
  });

  worker.on('failed', (job, err) => {
    console.log(\`Job \${job?.id} has failed with \${err.message}\`);
  });

  return worker;
};

export const createQueueEvents = (queueName: string) => {
  return new QueueEvents(queueName, { connection });
};
`);
  }
};
