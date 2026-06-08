const fs = require('fs-extra');
const path = require('path');

async function createFastifyTemplates() {
  const templatesDir = path.join(__dirname, '..', 'templates', 'fastify');
  await fs.ensureDir(templatesDir);

  // -----------------------------------------------------
  // 1. Small Scale (Basic Routing, single file entry point)
  // -----------------------------------------------------
  let base = path.join(templatesDir, 'small');
  await fs.ensureDir(path.join(base, 'src', 'routes'));

  await fs.writeFile(path.join(base, 'package.json'), JSON.stringify({
    name: "small-fastify-app",
    version: "1.0.0",
    scripts: {
      "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
      "build": "tsc",
      "start": "node dist/app.js"
    },
    dependencies: {
      "fastify": "^4.26.2",
      "@fastify/cors": "^8.5.0",
      "@fastify/helmet": "^11.1.1",
      "dotenv": "^16.4.5"
    },
    devDependencies: {
      "typescript": "^5.4.5",
      "ts-node-dev": "^2.0.0",
      "@types/node": "^20.12.7"
    }
  }, null, 2));

  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'tsconfig.json'), path.join(base, 'tsconfig.json'));

  await fs.writeFile(path.join(base, 'src', 'app.ts'), `// DB_IMPORT
// PLUGINS_IMPORT
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import indexRoutes from './routes/index';

dotenv.config();

const app = Fastify({ logger: true });

// DB_INIT
// PLUGINS_INIT

app.register(cors);
app.register(helmet);

app.register(indexRoutes, { prefix: '/api' });

const start = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
`);

  await fs.writeFile(path.join(base, 'src', 'routes', 'index.ts'), `import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', message: 'API is healthy' };
  });
}
`);

  // -----------------------------------------------------
  // 2. Medium Scale (Modular Structure)
  // -----------------------------------------------------
  base = path.join(templatesDir, 'medium');
  await fs.ensureDir(path.join(base, 'src', 'modules', 'health'));

  await fs.writeFile(path.join(base, 'package.json'), JSON.stringify({
    name: "medium-fastify-app",
    version: "1.0.0",
    scripts: {
      "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
      "build": "tsc",
      "start": "node dist/app.js"
    },
    dependencies: {
      "fastify": "^4.26.2",
      "@fastify/cors": "^8.5.0",
      "@fastify/helmet": "^11.1.1",
      "dotenv": "^16.4.5"
    },
    devDependencies: {
      "typescript": "^5.4.5",
      "ts-node-dev": "^2.0.0",
      "@types/node": "^20.12.7"
    }
  }, null, 2));

  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'tsconfig.json'), path.join(base, 'tsconfig.json'));

  await fs.writeFile(path.join(base, 'src', 'app.ts'), `// DB_IMPORT
// PLUGINS_IMPORT
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { healthRouter } from './modules/health/health.routes';

dotenv.config();

const app = Fastify({ logger: true });

// DB_INIT
// PLUGINS_INIT

app.register(cors);
app.register(helmet);

app.register(healthRouter, { prefix: '/api/health' });

const start = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'health.controller.ts'), `import { FastifyRequest, FastifyReply } from 'fastify';

export const getHealth = async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'ok', message: 'API is healthy' };
};
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'health.routes.ts'), `import { FastifyInstance } from 'fastify';
import { getHealth } from './health.controller';

export async function healthRouter(fastify: FastifyInstance) {
  fastify.get('/', getHealth);
}
`);

  // -----------------------------------------------------
  // 3. Enterprise Scale (DDD)
  // -----------------------------------------------------
  base = path.join(templatesDir, 'enterprise');
  await fs.ensureDir(path.join(base, 'src', 'modules', 'health', 'application'));
  await fs.ensureDir(path.join(base, 'src', 'modules', 'health', 'domain'));
  await fs.ensureDir(path.join(base, 'src', 'modules', 'health', 'infrastructure'));

  await fs.writeFile(path.join(base, 'package.json'), JSON.stringify({
    name: "enterprise-fastify-app",
    version: "1.0.0",
    scripts: {
      "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
      "build": "tsc",
      "start": "node dist/app.js"
    },
    dependencies: {
      "fastify": "^4.26.2",
      "@fastify/cors": "^8.5.0",
      "@fastify/helmet": "^11.1.1",
      "dotenv": "^16.4.5"
    },
    devDependencies: {
      "typescript": "^5.4.5",
      "ts-node-dev": "^2.0.0",
      "@types/node": "^20.12.7"
    }
  }, null, 2));

  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'tsconfig.json'), path.join(base, 'tsconfig.json'));

  await fs.writeFile(path.join(base, 'src', 'app.ts'), `// DB_IMPORT
// PLUGINS_IMPORT
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { healthRouter } from './modules/health/infrastructure/health.routes';

dotenv.config();

const app = Fastify({ logger: true });

// DB_INIT
// PLUGINS_INIT

app.register(cors);
app.register(helmet);

app.register(healthRouter, { prefix: '/api/health' });

const start = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'infrastructure', 'health.controller.ts'), `import { FastifyRequest, FastifyReply } from 'fastify';

export class HealthController {
  public async check(request: FastifyRequest, reply: FastifyReply) {
    return { status: 'ok', message: 'API is healthy' };
  }
}
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'infrastructure', 'health.routes.ts'), `import { FastifyInstance } from 'fastify';
import { HealthController } from './health.controller';

export async function healthRouter(fastify: FastifyInstance) {
  const controller = new HealthController();
  fastify.get('/', controller.check.bind(controller));
}
`);

  console.log('Fastify templates created successfully!');
}

createFastifyTemplates().catch(console.error);
