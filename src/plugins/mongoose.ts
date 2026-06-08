import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const mongoosePlugin: Plugin = {
  name: 'mongoose',
  dependencies: {
    'mongoose': '^8.3.2',
  },
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    // 1. Add MONGO_URI to .env
    const envPath = path.join(targetDir, '.env');
    const envContent = await fs.pathExists(envPath) ? await fs.readFile(envPath, 'utf-8') : '';
    await fs.writeFile(envPath, envContent + `\nMONGO_URI="mongodb://localhost:27017/${config.name}"\n`);

    // 2. Create src/database/mongoose.ts (or config/mongoose.ts)
    let dbDir = path.join(targetDir, 'src', 'database');
    if (config.scale === 'small') {
      dbDir = path.join(targetDir, 'src', 'config');
    }
    await fs.ensureDir(dbDir);
    await fs.writeFile(path.join(dbDir, 'mongoose.ts'), `import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error: any) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};
`);

    // 3. Inject DB connection into app.ts
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    let appTsContent = await fs.readFile(appTsPath, 'utf-8');

    const importPath = config.scale === 'small' ? './config/mongoose' : './database/mongoose';
    
    appTsContent = appTsContent.replace('// DB_IMPORT', `// DB_IMPORT\nimport { connectDB } from '${importPath}';`);
    appTsContent = appTsContent.replace('// DB_INIT', `// DB_INIT\nconnectDB();`);

    await fs.writeFile(appTsPath, appTsContent);
  }
};
