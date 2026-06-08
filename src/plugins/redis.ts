import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const redisPlugin: Plugin = {
  name: 'redis',
  dependencies: {
    'ioredis': '^5.4.1',
  },
  execute: async (context: PluginContext) => {
    const { targetDir } = context;

    const envPath = path.join(targetDir, '.env');
    const envContent = await fs.pathExists(envPath) ? await fs.readFile(envPath, 'utf-8') : '';
    if (!envContent.includes('REDIS_URL')) {
      await fs.writeFile(envPath, envContent + `\nREDIS_URL="redis://localhost:6379"\n`);
    }

    const configDir = path.join(targetDir, 'src', 'config');
    await fs.ensureDir(configDir);
    
    await fs.writeFile(path.join(configDir, 'redis.ts'), `import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis');
});

export default redisClient;
`);

    // Update docker-compose.yml if it exists
    const dockerComposePath = path.join(targetDir, 'docker-compose.yml');
    if (await fs.pathExists(dockerComposePath)) {
      let composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      
      if (!composeContent.includes('redis:')) {
        const redisService = `
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data`;
        
        composeContent += redisService;
        
        if (!composeContent.includes('redis_data:')) {
          composeContent += `\n  redis_data:\n`;
        }
        
        // Add redis to api environment
        composeContent = composeContent.replace(
          'environment:',
          'environment:\n      - REDIS_URL=redis://redis:6379'
        );
        
        // Add redis to depends_on
        if (composeContent.includes('depends_on:')) {
          composeContent = composeContent.replace('depends_on:', 'depends_on:\n      - redis');
        } else {
          composeContent = composeContent.replace('environment:', 'depends_on:\n      - redis\n    environment:');
        }

        await fs.writeFile(dockerComposePath, composeContent);
      }
    }
  }
};
