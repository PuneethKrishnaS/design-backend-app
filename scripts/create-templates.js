const fs = require('fs-extra');
const path = require('path');

async function createSmallScale() {
  const base = path.join(__dirname, '..', 'templates', 'express', 'small');
  await fs.ensureDir(path.join(base, 'src', 'routes'));
  await fs.ensureDir(path.join(base, 'src', 'controllers'));
  await fs.ensureDir(path.join(base, 'src', 'models'));
  await fs.ensureDir(path.join(base, 'src', 'middleware'));
  await fs.ensureDir(path.join(base, 'src', 'config'));

  // package.json.ejs
  await fs.writeFile(path.join(base, 'package.json.ejs'), JSON.stringify({
    name: "<%= projectName %>",
    version: "1.0.0",
    main: "dist/app.js",
    scripts: {
      "start": "node dist/app.js",
      "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
      "build": "tsc"
    },
    dependencies: {
      "express": "^4.19.2",
      "cors": "^2.8.5",
      "helmet": "^7.1.0",
      "dotenv": "^16.4.5"
    },
    devDependencies: {
      "typescript": "^5.4.5",
      "ts-node-dev": "^2.0.0",
      "@types/express": "^4.17.21",
      "@types/cors": "^2.8.17",
      "@types/node": "^20.12.7"
    }
  }, null, 2));

  // tsconfig.json
  await fs.writeFile(path.join(base, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: "es2022",
      module: "commonjs",
      rootDir: "./src",
      outDir: "./dist",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true
    },
    include: ["src/**/*"]
  }, null, 2));

  // src/app.ts
  await fs.writeFile(path.join(base, 'src', 'app.ts'), `// DB_IMPORT
// PLUGINS_IMPORT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import indexRoutes from './routes/index';

dotenv.config();

const app = express();

// DB_INIT
// PLUGINS_INIT

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api', indexRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`);

  // src/routes/index.ts
  await fs.writeFile(path.join(base, 'src', 'routes', 'index.ts'), `import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

const router = Router();

router.get('/health', getHealth);

export default router;
`);

  // src/controllers/health.controller.ts
  await fs.writeFile(path.join(base, 'src', 'controllers', 'health.controller.ts'), `import { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is healthy' });
};
`);
}

async function createMediumScale() {
  const base = path.join(__dirname, '..', 'templates', 'express', 'medium');
  await fs.ensureDir(path.join(base, 'src', 'modules', 'health'));
  await fs.ensureDir(path.join(base, 'src', 'middleware'));
  await fs.ensureDir(path.join(base, 'src', 'config'));
  await fs.ensureDir(path.join(base, 'src', 'database'));
  await fs.ensureDir(path.join(base, 'src', 'utils'));

  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'package.json.ejs'), path.join(base, 'package.json.ejs'));
  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'tsconfig.json'), path.join(base, 'tsconfig.json'));

  await fs.writeFile(path.join(base, 'src', 'app.ts'), `// DB_IMPORT
// PLUGINS_IMPORT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './modules/health/health.routes';

dotenv.config();

const app = express();

// DB_INIT
// PLUGINS_INIT

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/health', healthRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'health.routes.ts'), `import { Router } from 'express';
import { getHealth } from './health.controller';

export const healthRouter = Router();

healthRouter.get('/', getHealth);
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'health.controller.ts'), `import { Request, Response } from 'express';
import { getHealthStatus } from './health.service';

export const getHealth = (req: Request, res: Response) => {
  const status = getHealthStatus();
  res.json(status);
};
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'health.service.ts'), `export const getHealthStatus = () => {
  return { status: 'ok', message: 'API is healthy' };
};
`);
}

async function createEnterpriseScale() {
  const base = path.join(__dirname, '..', 'templates', 'express', 'enterprise');
  await fs.ensureDir(path.join(base, 'src', 'domain'));
  await fs.ensureDir(path.join(base, 'src', 'application'));
  await fs.ensureDir(path.join(base, 'src', 'infrastructure'));
  await fs.ensureDir(path.join(base, 'src', 'shared'));
  await fs.ensureDir(path.join(base, 'src', 'modules', 'health'));
  await fs.ensureDir(path.join(base, 'src', 'database'));

  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'package.json.ejs'), path.join(base, 'package.json.ejs'));
  await fs.copy(path.join(__dirname, '..', 'templates', 'express', 'small', 'tsconfig.json'), path.join(base, 'tsconfig.json'));

  await fs.writeFile(path.join(base, 'src', 'app.ts'), `// DB_IMPORT
// PLUGINS_IMPORT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './modules/health/infrastructure/health.routes';

dotenv.config();

const app = express();

// DB_INIT
// PLUGINS_INIT

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/health', healthRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`);

  await fs.ensureDir(path.join(base, 'src', 'modules', 'health', 'infrastructure'));
  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'infrastructure', 'health.routes.ts'), `import { Router } from 'express';
import { HealthController } from './health.controller';

export const healthRouter = Router();
const controller = new HealthController();

healthRouter.get('/', controller.getHealth.bind(controller));
`);

  await fs.writeFile(path.join(base, 'src', 'modules', 'health', 'infrastructure', 'health.controller.ts'), `import { Request, Response } from 'express';

export class HealthController {
  public getHealth(req: Request, res: Response) {
    res.json({ status: 'ok', message: 'API is healthy' });
  }
}
`);
}

async function run() {
  await createSmallScale();
  await createMediumScale();
  await createEnterpriseScale();
  console.log('Templates created successfully!');
}

run().catch(console.error);
