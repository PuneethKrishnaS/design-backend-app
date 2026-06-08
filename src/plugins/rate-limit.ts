import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const rateLimitPlugin: Plugin = {
  name: 'rate-limit',
  dependencies: {},
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    if (config.framework === 'express') {
      context.dependencies = {
        'express-rate-limit': '^7.2.0',
      };

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      let appTsContent = await fs.readFile(appTsPath, 'utf-8');
      
      appTsContent = appTsContent.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport rateLimit from 'express-rate-limit';`);
      
      const limiterCode = `
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per \`window\` (here, per 15 minutes).
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);
`;
      appTsContent = appTsContent.replace('// PLUGINS_INIT', `// PLUGINS_INIT\n${limiterCode}`);
      await fs.writeFile(appTsPath, appTsContent);

    } else if (config.framework === 'fastify') {
      context.dependencies = {
        '@fastify/rate-limit': '^9.1.0',
      };

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      let appTsContent = await fs.readFile(appTsPath, 'utf-8');
      
      appTsContent = appTsContent.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport fastifyRateLimit from '@fastify/rate-limit';`);
      
      const limiterCode = `
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '15 minutes'
});
`;
      appTsContent = appTsContent.replace('// PLUGINS_INIT', `// PLUGINS_INIT\n${limiterCode}`);
      await fs.writeFile(appTsPath, appTsContent);
    }
  }
};
