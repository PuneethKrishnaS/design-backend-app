import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const sequelizePlugin: Plugin = {
  name: 'sequelize',
  dependencies: {
    'sequelize': '^6.37.1',
    'mysql2': '^3.9.2'
  },
  execute: async (context: PluginContext) => {
    const { targetDir } = context;

    const envPath = path.join(targetDir, '.env');
    if (await fs.pathExists(envPath)) {
      let envContent = await fs.readFile(envPath, 'utf-8');
      envContent += `\n# MySQL / Sequelize Config\nDB_HOST=localhost\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=password\nDB_NAME=devforge_db\n`;
      await fs.writeFile(envPath, envContent);
    }

    const dbDir = path.join(targetDir, 'src', 'database');
    await fs.ensureDir(dbDir);

    await fs.writeFile(path.join(dbDir, 'sequelize.ts'), `import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'devforge_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  }
);
`);

    // We also need to inject the connection initialization into app.ts, similar to what prisma/mongoose does.
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    if (await fs.pathExists(appTsPath)) {
      let content = await fs.readFile(appTsPath, 'utf-8');
      content = content.replace('// DB_IMPORT', `// DB_IMPORT\nimport { sequelize } from './database/sequelize';`);
      content = content.replace('// DB_INIT', `// DB_INIT\nsequelize.authenticate().then(() => console.log('MySQL connected via Sequelize')).catch(console.error);`);
      await fs.writeFile(appTsPath, content);
    }
  }
};
