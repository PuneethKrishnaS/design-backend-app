import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { ProjectConfig } from '../cli/prompts';
import { copyTemplate, updatePackageJson } from '../utils/file';

export async function generateProject(config: ProjectConfig, targetDir: string) {
  const spinner = ora('Generating project structure...').start();

  try {
    // 1. Create target directory
    await fs.ensureDir(targetDir);

    // 2. Determine base template path
    const isCompiled = __filename.endsWith('.js') || __filename.endsWith('.mjs');
    const templateBaseDir = isCompiled 
      ? path.resolve(__dirname, '../templates') 
      : path.resolve(__dirname, '../../templates');
      
    const templateDir = path.resolve(templateBaseDir, config.framework, config.scale);
    
    if (!(await fs.pathExists(templateDir))) {
      throw new Error(`Template not found for ${config.framework} at scale ${config.scale}. Make sure the templates folder is included in the build.`);
    }

    // 3. Copy base template and render EJS
    await copyTemplate(templateDir, targetDir, { projectName: config.name });

    spinner.text = 'Updating package.json...';
    // 4. Set project name in package.json
    await updatePackageJson(targetDir, { name: config.name });

    // 5. Apply Plugins
    const pluginsToRun: any[] = [];
    
    // Add ORM plugin
    if (config.orm === 'prisma') {
      const { prismaPlugin } = require('../plugins/prisma');
      pluginsToRun.push(prismaPlugin);
    } else if (config.orm === 'mongoose') {
      const { mongoosePlugin } = require('../plugins/mongoose');
      pluginsToRun.push(mongoosePlugin);
    } else if (config.orm === 'sequelize') {
      const { sequelizePlugin } = require('../plugins/sequelize');
      pluginsToRun.push(sequelizePlugin);
    }

    // Add Auth plugin
    if (config.auth === 'jwt') {
      const { jwtPlugin } = require('../plugins/jwt');
      pluginsToRun.push(jwtPlugin);
    } else if (config.auth === 'session') {
      const { sessionPlugin } = require('../plugins/session');
      pluginsToRun.push(sessionPlugin);
    } else if (config.auth === 'oauth') {
      const { oauthPlugin } = require('../plugins/oauth');
      pluginsToRun.push(oauthPlugin);
    }

    // Add Feature plugins
    for (const pluginName of config.plugins) {
      if (pluginName === 'swagger') {
        const { swaggerPlugin } = require('../plugins/swagger');
        pluginsToRun.push(swaggerPlugin);
      } else if (pluginName === 'docker') {
        const { dockerPlugin } = require('../plugins/docker');
        pluginsToRun.push(dockerPlugin);
      } else if (pluginName === 'redis') {
        const { redisPlugin } = require('../plugins/redis');
        pluginsToRun.push(redisPlugin);
      } else if (pluginName === 'bullmq') {
        const { bullmqPlugin } = require('../plugins/bullmq');
        pluginsToRun.push(bullmqPlugin);
      } else if (pluginName === 'logger') {
        const { loggerPlugin } = require('../plugins/logger');
        pluginsToRun.push(loggerPlugin);
      } else if (pluginName === 'rate-limit') {
        const { rateLimitPlugin } = require('../plugins/rate-limit');
        pluginsToRun.push(rateLimitPlugin);
      } else if (pluginName === 'validation') {
        const { validationPlugin } = require('../plugins/validation');
        pluginsToRun.push(validationPlugin);
      } else if (pluginName === 'aws-s3') {
        const { awsS3Plugin } = require('../plugins/aws-s3');
        pluginsToRun.push(awsS3Plugin);
      } else if (pluginName === 'nodemailer') {
        const { nodemailerPlugin } = require('../plugins/nodemailer');
        pluginsToRun.push(nodemailerPlugin);
      } else if (pluginName === 'code-quality') {
        const { codeQualityPlugin } = require('../plugins/code-quality');
        pluginsToRun.push(codeQualityPlugin);
      }
    }

    const packageUpdates: any = { dependencies: {}, devDependencies: {} };

    for (const plugin of pluginsToRun) {
      spinner.text = `Applying plugin: ${plugin.name}...`;
      const context: any = { targetDir, config, dependencies: {}, devDependencies: {} };
      await plugin.execute(context);
      
      if (plugin.dependencies) {
        Object.assign(packageUpdates.dependencies, plugin.dependencies);
      }
      if (plugin.devDependencies) {
        Object.assign(packageUpdates.devDependencies, plugin.devDependencies);
      }
      if (context.dependencies) {
        Object.assign(packageUpdates.dependencies, context.dependencies);
      }
      if (context.devDependencies) {
        Object.assign(packageUpdates.devDependencies, context.devDependencies);
      }
    }

    if (config.useLatest) {
      for (const key in packageUpdates.dependencies) {
        packageUpdates.dependencies[key] = 'latest';
      }
      for (const key in packageUpdates.devDependencies) {
        packageUpdates.devDependencies[key] = 'latest';
      }
      
      const pkgPath = path.join(targetDir, 'package.json');
      if (await fs.pathExists(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        if (pkg.dependencies) {
          for (const key in pkg.dependencies) {
            pkg.dependencies[key] = 'latest';
          }
        }
        if (pkg.devDependencies) {
          for (const key in pkg.devDependencies) {
            pkg.devDependencies[key] = 'latest';
          }
        }
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }
    }

    if (Object.keys(packageUpdates.dependencies).length > 0 || Object.keys(packageUpdates.devDependencies).length > 0) {
      spinner.text = 'Updating package.json with plugin dependencies...';
      await updatePackageJson(targetDir, packageUpdates);
    }

    // 6. Save context for future generation
    await fs.writeJson(path.join(targetDir, '.devforge.json'), config, { spaces: 2 });

    spinner.text = 'Installing dependencies (this may take a minute)...';
    try {
      const { execSync } = require('child_process');
      execSync('npm install --loglevel=error --no-audit --no-fund', { cwd: targetDir, stdio: 'ignore' });
      spinner.succeed(chalk.green(`Successfully generated ${config.name} and installed dependencies!`));
    } catch (installError) {
      spinner.warn(chalk.yellow(`Successfully generated ${config.name}, but 'npm install' failed or had warnings.`));
    }
    
    console.log('\nNext steps:');
    console.log(chalk.cyan(`  cd ${config.name}`));
    console.log(chalk.cyan(`  npm run dev\n`));

  } catch (error: any) {
    spinner.fail(chalk.red('Failed to generate project.'));
    console.error(error.message);
    process.exit(1);
  }
}
