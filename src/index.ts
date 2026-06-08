#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { askProjectQuestions } from './cli/prompts';
import { generateProject } from './core/generator';

const program = new Command();

program
  .name('devforge')
  .description('Intelligent Backend Architecture Generator')
  .version('1.0.0');

program
  .command('init', { isDefault: true })
  .description('Initialize a new backend project')
  .argument('[project-name]', 'Name of the project')
  .argument('[version]', 'Optional version string like @latest')
  .action(async (projectNameInput, versionInput) => {
    let projectName = projectNameInput;
    let useLatest = false;

    if (projectName && projectName.endsWith('@latest')) {
      useLatest = true;
      projectName = projectName.replace('@latest', '');
    } else if (versionInput === '@latest' || process.argv.includes('@latest')) {
      useLatest = true;
    }

    console.log(chalk.blue.bold('\nWelcome to DevForge - The Intelligent Backend Architecture Generator\n'));
    
    try {
      const config = await askProjectQuestions(projectName);
      config.useLatest = useLatest;
      const targetDir = path.resolve(process.cwd(), config.name);
      
      console.log(`\nReady to forge ${chalk.cyan(config.name)}...\n`);
      await generateProject(config, targetDir);
    } catch (error) {
      if (error instanceof Error && error.message.includes('User force closed the prompt')) {
        console.log(chalk.yellow('\nProcess cancelled by user.'));
        process.exit(0);
      }
      console.error(chalk.red('\nAn unexpected error occurred:'), error);
      process.exit(1);
    }
  });

program
  .command('generate')
  .alias('g')
  .description('Generate a new module, queue, or component')
  .argument('<type>', 'Type of component to generate (module, queue, upload, auth)')
  .argument('[name]', 'Name of the component (not required for auth)')
  .option('--crud', 'Generate full CRUD implementation (for modules only)', false)
  .action(async (type, name, options) => {
    if (type !== 'auth' && !name) {
      console.error(chalk.red("error: missing required argument 'name'"));
      process.exit(1);
    }
    const { generateComponent } = require('./core/generator-engine');
    await generateComponent(type, name || 'auth', options);
  });

program
  .command('add')
  .description('Add a plugin (e.g. swagger, docker, redis) to an existing project')
  .argument('<plugin>', 'Name of the plugin to add')
  .action(async (plugin) => {
    const { addPluginToProject } = require('./core/generator-engine');
    await addPluginToProject(plugin);
  });

program
  .command('remove')
  .description('Remove a plugin from an existing project')
  .argument('<plugin>', 'Name of the plugin to remove')
  .action(async (plugin) => {
    const { removePluginFromProject } = require('./core/generator-engine');
    await removePluginFromProject(plugin);
  });

program.parse(process.argv);
