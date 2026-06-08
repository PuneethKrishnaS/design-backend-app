import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const sessionPlugin: Plugin = {
  name: 'session',
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    if (config.framework === 'express') {
      sessionPlugin.dependencies = {
        'express-session': '^1.18.0'
      };
      sessionPlugin.devDependencies = {
        '@types/express-session': '^1.18.0'
      };

      const middlewareDir = path.join(targetDir, 'src', 'middleware');
      await fs.ensureDir(middlewareDir);
      
      let sessionContent = `import session from 'express-session';
import { Request, Response, NextFunction } from 'express';

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});
`;

      if (config.rbac && config.roles) {
        sessionContent += `\nexport type Role = ${config.roles.map((r: string) => `'${r}'`).join(' | ')};\n\nexport const authorize = (roles: Role[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.session?.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};\n`;
      }
      await fs.writeFile(path.join(middlewareDir, 'session.ts'), sessionContent);

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      if (await fs.pathExists(appTsPath)) {
        let content = await fs.readFile(appTsPath, 'utf-8');
        content = content.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport { sessionMiddleware } from './middleware/session';`);
        const setupString = `app.use(sessionMiddleware);\n`;
        content = content.replace('app.use(express.json());', `app.use(express.json());\n${setupString}`);
        await fs.writeFile(appTsPath, content);
      }

    } else if (config.framework === 'fastify') {
      sessionPlugin.dependencies = {
        '@fastify/session': '^10.9.0',
        '@fastify/cookie': '^9.3.1'
      };

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      if (await fs.pathExists(appTsPath)) {
        let content = await fs.readFile(appTsPath, 'utf-8');
        content = content.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport fastifyCookie from '@fastify/cookie';\nimport fastifySession from '@fastify/session';`);
        
        let setupString = `app.register(fastifyCookie);\napp.register(fastifySession, {\n  secret: process.env.SESSION_SECRET || 'a-super-secret-key-that-is-at-least-32-chars-long',\n  cookie: {\n    secure: process.env.NODE_ENV === 'production',\n    maxAge: 24 * 60 * 60 * 1000\n  }\n});\n`;
        
        if (config.rbac && config.roles) {
          setupString += `\nexport type Role = ${config.roles.map((r: string) => `'${r}'`).join(' | ')};\n\napp.decorate('authorize', function (roles: Role[]) {\n  return async function (request: any, reply: any) {\n    if (!request.session?.user || !roles.includes(request.session.user.role)) {\n      reply.code(403).send({ error: 'Forbidden. Insufficient permissions.' });\n    }\n  };\n});\n`;
        }
        
        content = content.replace('// PLUGINS_INIT', `// PLUGINS_INIT\n${setupString}`);
        await fs.writeFile(appTsPath, content);
      }
    }

    const envPath = path.join(targetDir, '.env');
    if (await fs.pathExists(envPath)) {
      let envContent = await fs.readFile(envPath, 'utf-8');
      if (!envContent.includes('SESSION_SECRET')) {
        envContent += `\n# Session Config\nSESSION_SECRET=your_super_secret_session_key_here\n`;
        await fs.writeFile(envPath, envContent);
      }
    }
  }
};
