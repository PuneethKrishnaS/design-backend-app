import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const jwtPlugin: Plugin = {
  name: 'jwt',
  dependencies: {},
  devDependencies: {},
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    const envPath = path.join(targetDir, '.env');
    const envContent = await fs.pathExists(envPath) ? await fs.readFile(envPath, 'utf-8') : '';
    await fs.writeFile(envPath, envContent + `\nJWT_SECRET="devforge-super-secret-key-change-me"\n`);

    if (config.framework === 'express') {
      context.dependencies = {
        'jsonwebtoken': '^9.0.2',
        'bcrypt': '^5.1.1',
      };
      context.devDependencies = {
        '@types/jsonwebtoken': '^9.0.6',
        '@types/bcrypt': '^5.0.2',
      };

      const utilsDir = path.join(targetDir, 'src', 'utils');
      await fs.ensureDir(utilsDir);
      await fs.writeFile(path.join(utilsDir, 'jwt.ts'), `import jwt from 'jsonwebtoken';
export const generateToken = (payload: object, expiresIn = '1d') => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: expiresIn as any });
};
export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};
`);

      const middlewareDir = path.join(targetDir, 'src', 'middleware');
      await fs.ensureDir(middlewareDir);
      const routesContent = `import { Router } from 'express';
import { register, login } from './auth.controller';

export const authRouter = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and returns a JWT token.
 *     responses:
 *       201:
 *         description: Successfully registered and token generated.
 */
authRouter.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     description: Authenticates a user and returns a JWT token.
 *     responses:
 *       200:
 *         description: Successfully logged in and token generated.
 */
authRouter.post('/login', login);
`;
      let authContent = `import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
export interface AuthRequest extends Request { user?: any; }
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};\n`;

      if (config.rbac && config.roles) {
        authContent += `\nexport type Role = ${config.roles.map((r: string) => `'${r}'`).join(' | ')};\n\nexport const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};\n`;
      }
      await fs.writeFile(path.join(middlewareDir, 'auth.ts'), authContent);
    } else if (config.framework === 'fastify') {
      context.dependencies = {
        '@fastify/jwt': '^8.0.1',
        'bcrypt': '^5.1.1',
      };
      context.devDependencies = {
        '@types/bcrypt': '^5.0.2',
      };

      const appTsPath = path.join(targetDir, 'src', 'app.ts');
      let appTsContent = await fs.readFile(appTsPath, 'utf-8');
      appTsContent = appTsContent.replace('// PLUGINS_IMPORT', `// PLUGINS_IMPORT\nimport fastifyJwt from '@fastify/jwt';`);
      
      let initStr = `app.register(fastifyJwt, { secret: process.env.JWT_SECRET as string });\n\napp.decorate('authenticate', async function (request: any, reply: any) {\n  try {\n    await request.jwtVerify();\n  } catch (err) {\n    reply.send(err);\n  }\n});`;

      if (config.rbac && config.roles) {
        initStr += `\n\nexport type Role = ${config.roles.map((r: string) => `'${r}'`).join(' | ')};\n\napp.decorate('authorize', function (roles: Role[]) {\n  return async function (request: any, reply: any) {\n    if (!request.user || !roles.includes(request.user.role)) {\n      reply.code(403).send({ error: 'Forbidden. Insufficient permissions.' });\n    }\n  };\n});`;
      }

      appTsContent = appTsContent.replace('// PLUGINS_INIT', `// PLUGINS_INIT\n${initStr}`);
      await fs.writeFile(appTsPath, appTsContent);
    }
  }
};
