import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const awsS3Plugin: Plugin = {
  name: 'aws-s3',
  dependencies: {
    '@aws-sdk/client-s3': '^3.500.0',
    'multer': '^1.4.5-lts.1',
    'multer-s3': '^3.0.1'
  },
  devDependencies: {
    '@types/multer': '^1.4.11',
    '@types/multer-s3': '^3.0.3'
  },
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    // Add env vars
    const envPath = path.join(targetDir, '.env');
    if (await fs.pathExists(envPath)) {
      let envContent = await fs.readFile(envPath, 'utf-8');
      envContent += `\n# AWS S3 Config\nAWS_REGION=us-east-1\nAWS_ACCESS_KEY_ID=your_access_key\nAWS_SECRET_ACCESS_KEY=your_secret_key\nAWS_S3_BUCKET=your_bucket_name\n`;
      await fs.writeFile(envPath, envContent);
    }

    // Create S3 config file
    const configDir = path.join(targetDir, 'src', 'config');
    await fs.ensureDir(configDir);

    await fs.writeFile(path.join(configDir, 's3.ts'), `import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
`);

  }
};
