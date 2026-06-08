import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const prismaPlugin: Plugin = {
  name: 'prisma',
  dependencies: {
    '@prisma/client': '^5.13.0',
  },
  devDependencies: {
    'prisma': '^5.13.0',
  },
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    // 1. Create prisma/schema.prisma
    const prismaDir = path.join(targetDir, 'prisma');
    await fs.ensureDir(prismaDir);
    await fs.writeFile(path.join(prismaDir, 'schema.prisma'), `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`);

    // 2. Add DATABASE_URL to .env
    const envPath = path.join(targetDir, '.env');
    const envContent = await fs.pathExists(envPath) ? await fs.readFile(envPath, 'utf-8') : '';
    await fs.writeFile(envPath, envContent + `\nDATABASE_URL="postgresql://postgres:password@localhost:5432/${config.name}?schema=public"\n`);

    // 3. Create src/database/prisma.ts (or inject directly)
    let dbDir = path.join(targetDir, 'src', 'database');
    if (config.scale === 'small') {
      dbDir = path.join(targetDir, 'src', 'config');
    }
    await fs.ensureDir(dbDir);
    await fs.writeFile(path.join(dbDir, 'prisma.ts'), `import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
`);

    // 4. Inject DB connection test into app.ts
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    let appTsContent = await fs.readFile(appTsPath, 'utf-8');

    const importPath = config.scale === 'small' ? './config/prisma' : './database/prisma';
    
    appTsContent = appTsContent.replace('// DB_IMPORT', `// DB_IMPORT\nimport { prisma } from '${importPath}';`);
    appTsContent = appTsContent.replace('// DB_INIT', `// DB_INIT\nprisma.$connect().then(() => console.log('Database connected successfully')).catch(console.error);`);

    await fs.writeFile(appTsPath, appTsContent);

    // 5. Add scripts to package.json
    const pkgPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['db:push'] = 'prisma db push';
      pkg.scripts['db:studio'] = 'prisma studio';
      pkg.scripts['db:generate'] = 'prisma generate';
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }
  }
};
