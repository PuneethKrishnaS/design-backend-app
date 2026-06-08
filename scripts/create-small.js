const fs = require('fs-extra');
const path = require('path');

async function createSmallScale() {
  const base = path.join(__dirname, 'templates', 'express', 'small');
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
  await fs.writeFile(path.join(base, 'src', 'app.ts'), `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import indexRoutes from './routes/index';

dotenv.config();

const app = express();

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

createSmallScale().catch(console.error);
