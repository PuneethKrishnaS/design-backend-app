import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ejs from 'ejs';
import { ProjectConfig } from '../cli/prompts';
import { copyTemplate } from '../utils/file';

export async function generateComponent(type: string, name: string, options: { crud?: boolean }) {
  const targetDir = process.cwd();
  const configPath = path.join(targetDir, '.devforge.json');

  if (!(await fs.pathExists(configPath))) {
    console.error(chalk.red('Error: .devforge.json not found. Are you inside a DevForge generated project?'));
    process.exit(1);
  }

  const config: ProjectConfig = await fs.readJson(configPath);
  
  if (config.framework !== 'express' && config.framework !== 'fastify') {
    console.error(chalk.yellow(`Generation for ${config.framework} is not yet supported.`));
    process.exit(1);
  }

  const isCompiled = __filename.endsWith('.js') || __filename.endsWith('.mjs');
  const templateBaseDir = isCompiled 
    ? path.resolve(__dirname, '../templates') 
    : path.resolve(__dirname, '../../templates');

  const generatorTemplatesDir = path.resolve(templateBaseDir, config.framework, 'generators');

  const data = {
    moduleName: name,
    ModuleName: name.charAt(0).toUpperCase() + name.slice(1),
    crud: options.crud || false,
    framework: config.framework,
    config
  };

  try {
    if (type === 'module') {
      console.log(chalk.blue(`Generating ${chalk.bold(name)} module for ${config.scale} scale...`));
      if (config.scale === 'small') {
        await generateSmallScaleModule(targetDir, generatorTemplatesDir, data);
      } else if (config.scale === 'medium') {
        await generateMediumScaleModule(targetDir, generatorTemplatesDir, data);
      } else if (config.scale === 'enterprise') {
        await generateEnterpriseScaleModule(targetDir, generatorTemplatesDir, data);
      }
      console.log(chalk.green(`Successfully generated module: ${name}`));
    } else if (type === 'queue') {
      console.log(chalk.blue(`Generating ${chalk.bold(name)} queue...`));
      await generateQueue(targetDir, generatorTemplatesDir, data);
      console.log(chalk.green(`Successfully generated queue: ${name}`));
    } else if (type === 'upload') {
      console.log(chalk.blue(`Generating ${chalk.bold(name)} upload service...`));
      await generateUpload(targetDir, generatorTemplatesDir, data);
      console.log(chalk.green(`Successfully generated upload service: ${name}`));
    } else if (type === 'auth') {
      console.log(chalk.blue(`Generating standard Auth endpoints...`));
      await generateAuth(targetDir, generatorTemplatesDir, data, config);
      console.log(chalk.green(`Successfully generated Auth endpoints!`));
    } else {
      console.error(chalk.red(`Error: Unknown component type '${type}'`));
    }
  } catch (err: any) {
    console.error(chalk.red(`Error generating ${type}:`), err.message);
  }
}

async function generateQueue(targetDir: string, templateDir: string, data: any) {
  const { moduleName } = data;
  const queueDir = path.join(targetDir, 'src', 'queues');
  
  await renderAndWrite(
    path.join(templateDir, 'queue.ejs'),
    path.join(queueDir, `${moduleName}.queue.ts`),
    data
  );

  await renderAndWrite(
    path.join(templateDir, 'worker.ejs'),
    path.join(queueDir, `${moduleName}.worker.ts`),
    data
  );
}

async function generateUpload(targetDir: string, templateDir: string, data: any) {
  const { moduleName } = data;
  const uploadDir = path.join(targetDir, 'src', 'uploads');
  
  await renderAndWrite(
    path.join(templateDir, 'upload.ejs'),
    path.join(uploadDir, `${moduleName}.upload.ts`),
    data
  );
}

async function generateAuth(targetDir: string, templateDir: string, data: any, config: ProjectConfig) {
  let controllerDir, routeDir;

  if (config.architecturePattern === 'mvc') {
    controllerDir = path.join(targetDir, 'src', 'controllers');
    routeDir = path.join(targetDir, 'src', 'routes');
  } else {
    controllerDir = path.join(targetDir, 'src', 'modules', 'auth');
    routeDir = controllerDir;
  }

  await fs.ensureDir(controllerDir);
  await fs.ensureDir(routeDir);

  const isExpress = config.framework === 'express';
  const isMongoose = config.orm === 'mongoose';
  const isPrisma = config.orm === 'prisma';
  const isSequelize = config.orm === 'sequelize';

  // Construct Imports
  let controllerContent = '';
  if (isExpress) controllerContent += `import { Request, Response } from 'express';\n`;
  if (!isExpress) controllerContent += `import { FastifyRequest, FastifyReply } from 'fastify';\n`;
  controllerContent += `import bcrypt from 'bcrypt';\n`;
  
  if (config.auth === 'jwt') {
    const depth = config.architecturePattern === 'mvc' ? '../' : '../../';
    controllerContent += `import { generateToken } from '${depth}utils/jwt';\n`;
  }

  // Model Imports
  if (isMongoose) {
    const depth = config.architecturePattern === 'mvc' ? '../' : '../../';
    controllerContent += `import { Users } from '${depth}models/users.model';\n`;
  } else if (isSequelize) {
    const depth = config.architecturePattern === 'mvc' ? '../' : '../../';
    controllerContent += `import { Users } from '${depth}models/users.model';\n`;
  } else if (isPrisma) {
    const depth = config.scale === 'small' ? '../config/' : config.architecturePattern === 'mvc' ? '../database/' : '../../database/';
    controllerContent += `import { prisma } from '${depth}prisma';\n`;
  }

  // Helper Types
  const reqType = isExpress ? 'Request' : 'FastifyRequest';
  const resType = isExpress ? 'Response' : 'FastifyReply';
  const res201 = isExpress ? `res.status(201).json` : `reply.code(201).send`;
  const res200 = isExpress ? `res.status(200).json` : `reply.code(200).send`;
  const res400 = isExpress ? `res.status(400).json` : `reply.code(400).send`;
  const res401 = isExpress ? `res.status(401).json` : `reply.code(401).send`;
  const bodyVar = isExpress ? `req.body` : `(request.body as any)`;

  // Register Controller
  controllerContent += `\nexport const register = async (${isExpress ? 'req' : 'request'}: ${reqType}, ${isExpress ? 'res' : 'reply'}: ${resType}) => {\n`;
  controllerContent += `  try {\n    const { email, password, name } = ${bodyVar};\n`;
  controllerContent += `    if (!email || !password) return ${res400}({ error: 'Email and password are required' });\n`;
  controllerContent += `    const hashedPassword = await bcrypt.hash(password, 10);\n`;
  
  if (isPrisma) {
    controllerContent += `    const existingUser = await prisma.users.findUnique({ where: { email } });\n`;
    controllerContent += `    if (existingUser) return ${res400}({ error: 'User already exists' });\n`;
    controllerContent += `    const user = await prisma.users.create({ data: { email, password: hashedPassword, name } });\n`;
  } else if (isMongoose) {
    controllerContent += `    const existingUser = await Users.findOne({ email });\n`;
    controllerContent += `    if (existingUser) return ${res400}({ error: 'User already exists' });\n`;
    controllerContent += `    const user = await Users.create({ email, password: hashedPassword, name });\n`;
  } else if (isSequelize) {
    controllerContent += `    const existingUser = await Users.findOne({ where: { email } });\n`;
    controllerContent += `    if (existingUser) return ${res400}({ error: 'User already exists' });\n`;
    controllerContent += `    const user = await Users.create({ email, password: hashedPassword, name });\n`;
  }

  if (config.auth === 'jwt') {
    controllerContent += `    const token = generateToken({ id: user.id, role: user.role });\n`;
    controllerContent += `    return ${res201}({ message: 'User registered successfully', token });\n`;
  } else {
    if (isExpress) controllerContent += `    (req.session as any).userId = user.id;\n`;
    controllerContent += `    return ${res201}({ message: 'User registered successfully' });\n`;
  }
  controllerContent += `  } catch (error: any) {\n    return ${res400}({ error: error.message });\n  }\n};\n`;

  // Login Controller
  controllerContent += `\nexport const login = async (${isExpress ? 'req' : 'request'}: ${reqType}, ${isExpress ? 'res' : 'reply'}: ${resType}) => {\n`;
  controllerContent += `  try {\n    const { email, password } = ${bodyVar};\n`;
  controllerContent += `    if (!email || !password) return ${res400}({ error: 'Email and password are required' });\n`;

  if (isPrisma) {
    controllerContent += `    const user = await prisma.user.findUnique({ where: { email } });\n`;
  } else if (isMongoose) {
    controllerContent += `    const user = await User.findOne({ email });\n`;
  } else if (isSequelize) {
    controllerContent += `    const user = await User.findOne({ where: { email } });\n`;
  }

  controllerContent += `    if (!user) return ${res401}({ error: 'Invalid credentials' });\n`;
  controllerContent += `    const isMatch = await bcrypt.compare(password, user.password);\n`;
  controllerContent += `    if (!isMatch) return ${res401}({ error: 'Invalid credentials' });\n`;

  if (config.auth === 'jwt') {
    controllerContent += `    const token = generateToken({ id: user.id, role: user.role });\n`;
    controllerContent += `    return ${res200}({ message: 'Login successful', token });\n`;
  } else {
    if (isExpress) controllerContent += `    (req.session as any).userId = user.id;\n`;
    controllerContent += `    return ${res200}({ message: 'Login successful' });\n`;
  }
  controllerContent += `  } catch (error: any) {\n    return ${res400}({ error: error.message });\n  }\n};\n`;

  // Logout Controller
  controllerContent += `\nexport const logout = async (${isExpress ? 'req' : 'request'}: ${reqType}, ${isExpress ? 'res' : 'reply'}: ${resType}) => {\n`;
  if (config.auth === 'session' && isExpress) {
    controllerContent += `  req.session.destroy((err) => {\n    if (err) return ${res400}({ error: 'Logout failed' });\n    res.clearCookie('connect.sid');\n    return ${res200}({ message: 'Logged out successfully' });\n  });\n};\n`;
  } else {
    controllerContent += `  return ${res200}({ message: 'Logged out successfully. Please remove token from client.' });\n};\n`;
  }

  // Routing
  let routeContent = '';
  if (isExpress) {
    routeContent = `import { Router } from 'express';\nimport { register, login, logout } from '${config.architecturePattern === 'mvc' ? '../controllers/auth.controller' : './auth.controller'}';\n`;

    const swaggerComments = `
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user account.
 *     responses:
 *       201:
 *         description: Successfully registered.
 */
authRouter.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login an existing user
 *     description: Authenticates a user.
 *     responses:
 *       200:
 *         description: Successfully logged in.
 */
authRouter.post('/login', login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout a user
 *     description: Logs out the current user.
 *     responses:
 *       200:
 *         description: Successfully logged out.
 */
authRouter.post('/logout', logout);
`;

    if (config.rbac && config.roles) {
      const highestRole = config.roles[config.roles.length - 1];
      controllerContent += `\nexport const adminOnly = async (req: Request, res: Response) => { res.status(200).json({ message: 'Welcome Admin' }); };\n`;
      routeContent += `import { authorize } from '${config.architecturePattern === 'mvc' ? '../middleware/' : '../../middleware/'}${config.auth === 'jwt' ? 'auth' : 'session'}';\n`;
      routeContent += `\nexport const authRouter = Router();\n${swaggerComments}\n/**\n * @openapi\n * /api/auth/admin:\n *   get:\n *     summary: Admin only route\n *     description: Restricted to admins.\n *     responses:\n *       200:\n *         description: Success.\n */\nauthRouter.get('/admin', authorize(['${highestRole}']), adminOnly);\n`;
    } else {
      routeContent += `\nexport const authRouter = Router();\n${swaggerComments}\n`;
    }

  } else if (!isExpress) {
    if (config.rbac && config.roles) {
      const highestRole = config.roles[config.roles.length - 1];
      controllerContent += `\nexport const adminOnly = async (request: FastifyRequest, reply: FastifyReply) => { reply.code(200).send({ message: 'Welcome Admin' }); };\n`;
      routeContent = `import { FastifyInstance } from 'fastify';\nimport { register, login, logout, adminOnly } from '${config.architecturePattern === 'mvc' ? '../controllers/auth.controller' : './auth.controller'}';\n\nexport async function authRouter(fastify: FastifyInstance) {\n  fastify.post('/register', register);\n  fastify.post('/login', login);\n  fastify.post('/logout', logout);\n  fastify.get('/admin', { preHandler: [(fastify as any).authorize(['${highestRole}'])] }, adminOnly);\n}\n`;
    } else {
      routeContent = `import { FastifyInstance } from 'fastify';\nimport { register, login, logout } from '${config.architecturePattern === 'mvc' ? '../controllers/auth.controller' : './auth.controller'}';\n\nexport async function authRouter(fastify: FastifyInstance) {\n  fastify.post('/register', register);\n  fastify.post('/login', login);\n  fastify.post('/logout', logout);\n}\n`;
    }
  }

  await fs.writeFile(path.join(controllerDir, 'auth.controller.ts'), controllerContent);
  await fs.writeFile(path.join(routeDir, 'auth.routes.ts'), routeContent);
  
  const routeImportPath = config.architecturePattern === 'mvc' ? './routes/auth.routes' : './modules/auth/auth.routes';
  await injectRouteIntoApp(targetDir, 'auth', routeImportPath, config.architecturePattern, config.framework);
}

async function renderAndWrite(src: string, dest: string, data: any) {
  const content = await fs.readFile(src, 'utf-8');
  const rendered = ejs.render(content, data);
  await fs.ensureDir(path.dirname(dest));
  await fs.writeFile(dest, rendered);
}

async function generateSmallScaleModule(targetDir: string, templateDir: string, data: any) {
  const { moduleName, framework, config } = data;
  data.middlewarePath = '../middleware';
  
  if (config.orm === 'mongoose') {
    await renderAndWrite(
      path.join(templateDir, 'mongoose.model.ejs'),
      path.join(targetDir, 'src', 'models', `${moduleName}.model.ts`),
      data
    );
  } else if (config.orm === 'sequelize') {
    data.sequelizePath = '../config';
    await renderAndWrite(
      path.join(templateDir, 'sequelize.model.ejs'),
      path.join(targetDir, 'src', 'models', `${moduleName}.model.ts`),
      data
    );
  } else if (config.orm === 'prisma') {
    console.log(chalk.yellow(`\nNote: For Prisma, please add 'model ${data.ModuleName} { ... }' to your prisma/schema.prisma and run 'npx prisma generate'.`));
  }

  // Controller
  await renderAndWrite(
    path.join(templateDir, 'controller.ejs'),
    path.join(targetDir, 'src', 'controllers', `${moduleName}.controller.ts`),
    data
  );
  
  // Route
  await renderAndWrite(
    path.join(templateDir, 'route.ejs'),
    path.join(targetDir, 'src', 'routes', `${moduleName}.routes.ts`),
    data
  );

  await injectRouteIntoApp(targetDir, moduleName, `./routes/${moduleName}.routes`, 'small', framework);
}

async function generateMediumScaleModule(targetDir: string, templateDir: string, data: any) {
  const { moduleName, framework, config } = data;
  const moduleDir = path.join(targetDir, 'src', 'modules', moduleName);
  data.middlewarePath = '../../middleware';

  if (config.orm === 'mongoose') {
    await renderAndWrite(
      path.join(templateDir, 'mongoose.model.ejs'),
      path.join(moduleDir, `${moduleName}.model.ts`),
      data
    );
  } else if (config.orm === 'sequelize') {
    data.sequelizePath = '../../database';
    await renderAndWrite(
      path.join(templateDir, 'sequelize.model.ejs'),
      path.join(moduleDir, `${moduleName}.model.ts`),
      data
    );
  } else if (config.orm === 'prisma') {
    console.log(chalk.yellow(`\nNote: For Prisma, please add 'model ${data.ModuleName} { ... }' to your prisma/schema.prisma and run 'npx prisma generate'.`));
  }

  await renderAndWrite(
    path.join(templateDir, 'controller.ejs'),
    path.join(moduleDir, `${moduleName}.controller.ts`),
    data
  );

  await renderAndWrite(
    path.join(templateDir, 'service.ejs'),
    path.join(moduleDir, `${moduleName}.service.ts`),
    data
  );

  await renderAndWrite(
    path.join(templateDir, 'route.ejs'),
    path.join(moduleDir, `${moduleName}.routes.ts`),
    data
  );

  await injectRouteIntoApp(targetDir, moduleName, `./modules/${moduleName}/${moduleName}.routes`, 'medium', framework);
}

async function generateEnterpriseScaleModule(targetDir: string, templateDir: string, data: any) {
  const { moduleName, framework, config } = data;
  const moduleDir = path.join(targetDir, 'src', 'modules', moduleName);
  data.middlewarePath = '../../../middleware';

  if (config.orm === 'mongoose') {
    await fs.ensureDir(path.join(moduleDir, 'domain'));
    await renderAndWrite(
      path.join(templateDir, 'mongoose.model.ejs'),
      path.join(moduleDir, 'domain', `${moduleName}.model.ts`),
      data
    );
  } else if (config.orm === 'sequelize') {
    await fs.ensureDir(path.join(moduleDir, 'domain'));
    data.sequelizePath = '../../../database';
    await renderAndWrite(
      path.join(templateDir, 'sequelize.model.ejs'),
      path.join(moduleDir, 'domain', `${moduleName}.model.ts`),
      data
    );
  } else if (config.orm === 'prisma') {
    console.log(chalk.yellow(`\nNote: For Prisma, please add 'model ${data.ModuleName} { ... }' to your prisma/schema.prisma and run 'npx prisma generate'.`));
  }

  // Infrastructure (Controllers, Routes)
  await renderAndWrite(
    path.join(templateDir, 'controller.class.ejs'),
    path.join(moduleDir, 'infrastructure', `${moduleName}.controller.ts`),
    data
  );

  await renderAndWrite(
    path.join(templateDir, 'route.class.ejs'),
    path.join(moduleDir, 'infrastructure', `${moduleName}.routes.ts`),
    data
  );

  // Application (Services)
  await renderAndWrite(
    path.join(templateDir, 'service.class.ejs'),
    path.join(moduleDir, 'application', `${moduleName}.service.ts`),
    data
  );

  await injectRouteIntoApp(targetDir, moduleName, `./modules/${moduleName}/infrastructure/${moduleName}.routes`, 'enterprise', framework);
}

async function injectRouteIntoApp(targetDir: string, moduleName: string, routePath: string, scale: string, framework: string) {
  const appTsPath = path.join(targetDir, 'src', 'app.ts');
  if (!(await fs.pathExists(appTsPath))) return;

  let content = await fs.readFile(appTsPath, 'utf-8');
  const routeImportName = `${moduleName}Router`;
  
  if (!content.includes(routeImportName)) {
    if (framework === 'express') {
      content = content.replace('import express', `import { ${routeImportName} } from '${routePath}';\nimport express`);
      const useLine = `app.use('/api/${moduleName}', ${routeImportName});\n\n`;
      content = content.replace('app.use((err: any', `${useLine}app.use((err: any`);
    } else if (framework === 'fastify') {
      content = content.replace('import Fastify', `import { ${routeImportName} } from '${routePath}';\nimport Fastify`);
      const registerLine = `app.register(${routeImportName}, { prefix: '/api/${moduleName}' });\n\n`;
      content = content.replace('const start = async', `${registerLine}const start = async`);
    }
    
    await fs.writeFile(appTsPath, content);
  }
}

export async function addPluginToProject(pluginName: string) {
  const targetDir = process.cwd();
  const configPath = path.join(targetDir, '.devforge.json');

  if (!(await fs.pathExists(configPath))) {
    console.error(chalk.red('Error: .devforge.json not found. Are you inside a DevForge generated project?'));
    process.exit(1);
  }

  const config: ProjectConfig = await fs.readJson(configPath);
  
  if (config.plugins && config.plugins.includes(pluginName)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' is already installed in this project.`));
    process.exit(0);
  }

  let pluginModule;
  try {
    switch (pluginName) {
      case 'swagger': pluginModule = require('../plugins/swagger'); break;
      case 'docker': pluginModule = require('../plugins/docker'); break;
      case 'redis': pluginModule = require('../plugins/redis'); break;
      case 'bullmq': pluginModule = require('../plugins/bullmq'); break;
      case 'logger': pluginModule = require('../plugins/logger'); break;
      case 'rate-limit': pluginModule = require('../plugins/rate-limit'); break;
      case 'validation': pluginModule = require('../plugins/validation'); break;
      case 'aws-s3': pluginModule = require('../plugins/aws-s3'); break;
      case 'nodemailer': pluginModule = require('../plugins/nodemailer'); break;
      case 'code-quality': pluginModule = require('../plugins/code-quality'); break;
      default: throw new Error('Plugin not found');
    }
  } catch (err) {
    console.error(chalk.red(`Error: Plugin '${pluginName}' not found or is invalid.`));
    process.exit(1);
  }

  const pluginKey = Object.keys(pluginModule).find(k => k.toLowerCase().includes('plugin'));
  if (!pluginKey) {
    console.error(chalk.red(`Error: Invalid plugin module format.`));
    process.exit(1);
  }

  const plugin = pluginModule[pluginKey];
  
  console.log(chalk.blue(`Adding plugin: ${plugin.name}...`));
  const context: any = { targetDir, config, dependencies: {}, devDependencies: {} };
  await plugin.execute(context);
  
  const packageUpdates: any = { dependencies: {}, devDependencies: {} };
  if (plugin.dependencies) Object.assign(packageUpdates.dependencies, plugin.dependencies);
  if (plugin.devDependencies) Object.assign(packageUpdates.devDependencies, plugin.devDependencies);
  if (context.dependencies) Object.assign(packageUpdates.dependencies, context.dependencies);
  if (context.devDependencies) Object.assign(packageUpdates.devDependencies, context.devDependencies);

  if (Object.keys(packageUpdates.dependencies).length > 0 || Object.keys(packageUpdates.devDependencies).length > 0) {
    console.log(chalk.cyan('Updating package.json...'));
    const { updatePackageJson } = require('../utils/file');
    await updatePackageJson(targetDir, packageUpdates);
    
    console.log(chalk.cyan('Installing dependencies...'));
    try {
      const { execSync } = require('child_process');
      execSync('npm install --loglevel=error --no-audit --no-fund', { cwd: targetDir, stdio: 'inherit' });
    } catch (err) {
      console.warn(chalk.yellow('npm install finished with warnings or errors.'));
    }
  }

  // Update config
  if (!config.plugins) config.plugins = [];
  config.plugins.push(pluginName);
  await fs.writeJson(configPath, config, { spaces: 2 });

  console.log(chalk.green(`\nSuccessfully added plugin: ${pluginName}!`));
}

export async function removePluginFromProject(pluginName: string) {
  const targetDir = process.cwd();
  const configPath = path.join(targetDir, '.devforge.json');

  if (!(await fs.pathExists(configPath))) {
    console.error(chalk.red('Error: .devforge.json not found. Are you inside a DevForge generated project?'));
    process.exit(1);
  }

  const config: ProjectConfig = await fs.readJson(configPath);
  
  if (!config.plugins || !config.plugins.includes(pluginName)) {
    console.log(chalk.yellow(`Plugin '${pluginName}' is not installed in this project.`));
    process.exit(0);
  }

  let pluginModule;
  try {
    switch (pluginName) {
      case 'swagger': pluginModule = require('../plugins/swagger'); break;
      case 'docker': pluginModule = require('../plugins/docker'); break;
      case 'redis': pluginModule = require('../plugins/redis'); break;
      case 'bullmq': pluginModule = require('../plugins/bullmq'); break;
      case 'logger': pluginModule = require('../plugins/logger'); break;
      case 'rate-limit': pluginModule = require('../plugins/rate-limit'); break;
      case 'validation': pluginModule = require('../plugins/validation'); break;
      case 'aws-s3': pluginModule = require('../plugins/aws-s3'); break;
      case 'nodemailer': pluginModule = require('../plugins/nodemailer'); break;
      case 'code-quality': pluginModule = require('../plugins/code-quality'); break;
      default: throw new Error('Plugin not found');
    }
  } catch (err) {
    console.error(chalk.red(`Error: Plugin '${pluginName}' not found or is invalid.`));
    process.exit(1);
  }

  const pluginKey = Object.keys(pluginModule).find(k => k.toLowerCase().includes('plugin'));
  if (!pluginKey) {
    console.error(chalk.red(`Error: Invalid plugin module format.`));
    process.exit(1);
  }

  const plugin = pluginModule[pluginKey];
  
  console.log(chalk.blue(`Removing plugin: ${plugin.name}...`));
  const context: any = { targetDir, config, dependencies: {}, devDependencies: {} };
  
  if (plugin.uninstall) {
    await plugin.uninstall(context);
  } else {
    // Generalized cleanup
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    if (await fs.pathExists(appTsPath)) {
      let content = await fs.readFile(appTsPath, 'utf-8');
      const lines = content.split('\n');
      const newLines = lines.filter(line => !line.toLowerCase().includes(pluginName.toLowerCase()));
      await fs.writeFile(appTsPath, newLines.join('\n'));
    }
    
    // Attempt to remove standard config file
    await fs.remove(path.join(targetDir, 'src', 'config', `${pluginName}.ts`));
    await fs.remove(path.join(targetDir, 'src', 'plugins', `${pluginName}.ts`));
  }
  
  // We need to execute the plugin on a dummy context to get its dependencies for uninstallation
  const dummyContext: any = { targetDir: '/dev/null', config, dependencies: {}, devDependencies: {} };
  
  // Try to figure out dependencies
  let depsToRemove: string[] = [];
  if (plugin.dependencies) depsToRemove.push(...Object.keys(plugin.dependencies));
  if (plugin.devDependencies) depsToRemove.push(...Object.keys(plugin.devDependencies));
  
  // To get dynamic deps, we'd have to run execute, but that modifies files. 
  // We'll rely on the user to clean up package.json for advanced plugins or we can implement it safely later.

  console.log(chalk.cyan('Updating project configuration...'));
  
  // Update config
  config.plugins = config.plugins.filter(p => p !== pluginName);
  await fs.writeJson(configPath, config, { spaces: 2 });

  console.log(chalk.green(`\nSuccessfully removed plugin: ${pluginName}!`));
  console.log(chalk.yellow(`Note: You may need to manually uninstall related npm packages (e.g. npm uninstall ${pluginName})`));
}
