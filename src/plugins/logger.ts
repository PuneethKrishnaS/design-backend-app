import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const loggerPlugin: Plugin = {
  name: 'logger',
  dependencies: {
    'winston': '^3.13.0',
  },
  execute: async (context: PluginContext) => {
    const { targetDir } = context;

    const utilsDir = path.join(targetDir, 'src', 'utils');
    await fs.ensureDir(utilsDir);
    
    await fs.writeFile(path.join(utilsDir, 'logger.ts'), `import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  return \`\${timestamp} [\${level}]: \${message}\`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        myFormat
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
`);

    // We can also replace console.log in app.ts with logger.info
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    if (await fs.pathExists(appTsPath)) {
      let appTsContent = await fs.readFile(appTsPath, 'utf-8');
      appTsContent = appTsContent.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport { logger } from './utils/logger';`);
      appTsContent = appTsContent.replace(/console\.log/g, 'logger.info');
      appTsContent = appTsContent.replace(/console\.error/g, 'logger.error');
      await fs.writeFile(appTsPath, appTsContent);
    }
  }
};
