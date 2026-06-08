import path from 'path';
import fs from 'fs-extra';
import { generateProject } from '../src/core/generator';
import { ProjectConfig } from '../src/cli/prompts';
import chalk from 'chalk';

async function test() {
  const pgConfig: ProjectConfig = {
    name: 'test-postgres-app',
    framework: 'express',
    language: 'typescript',
    scale: 'small',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'jwt',
    rbac: true,
    roles: ['user', 'admin'],
    validation: 'joi',
    teamSize: '1-3',
    expectedTraffic: 'low',
    architecturePattern: 'mvc',
    plugins: ['swagger', 'docker', 'redis', 'bullmq', 'logger', 'rate-limit', 'validation', 'code-quality', 'nodemailer', 'aws-s3']
  };

  const mysqlConfig: ProjectConfig = {
    name: 'test-mysql-app',
    framework: 'express',
    language: 'typescript',
    scale: 'medium',
    database: 'mysql',
    orm: 'sequelize',
    auth: 'session',
    rbac: true,
    roles: ['user', 'moderator', 'admin'],
    validation: 'none',
    teamSize: '4-10',
    expectedTraffic: 'medium',
    architecturePattern: 'feature',
    plugins: ['swagger', 'docker', 'code-quality']
  };

  const fastifyConfig: ProjectConfig = {
    name: 'test-fastify-app',
    framework: 'fastify',
    language: 'typescript',
    scale: 'enterprise',
    database: 'postgresql',
    orm: 'prisma',
    auth: 'oauth',
    rbac: false,
    roles: [],
    validation: 'zod',
    teamSize: '10+',
    expectedTraffic: 'high',
    architecturePattern: 'clean',
    plugins: ['swagger', 'docker', 'redis', 'bullmq', 'logger', 'rate-limit', 'validation', 'aws-s3']
  };

  const originalCwd = process.cwd;

  console.log('Testing generation of Postgres/Prisma app...');
  await generateProject(pgConfig, path.resolve(__dirname, '..', 'test-postgres-app'));

  process.cwd = () => path.resolve(__dirname, '..', 'test-postgres-app');
  const { generateComponent: generateComponentPg } = require('../src/core/generator-engine');
  await generateComponentPg('upload', 'avatar', {});
  process.cwd = originalCwd;

  console.log('Testing generation of MySQL/Sequelize app...');
  await fs.remove(path.join(__dirname, '..', 'test-mysql-app'));
  await generateProject(mysqlConfig, path.join(__dirname, '..', 'test-mysql-app'));
  console.log(chalk.green('Successfully generated test-mysql-app!\n'));

  console.log('Testing generation of Fastify app...');
  await generateProject(fastifyConfig, path.resolve(__dirname, '..', 'test-fastify-app'));

  process.cwd = () => path.resolve(__dirname, '..', 'test-fastify-app');
  const { generateComponent: generateComponentFastify } = require('../src/core/generator-engine');
  await generateComponentFastify('auth', 'auth', {});
  process.cwd = originalCwd;

  console.log('Testing generation of user module (CRUD) in Fastify app...');
  process.cwd = () => path.resolve(__dirname, '..', 'test-fastify-app');
  
  const { generateComponent } = require('../src/core/generator-engine');
  await generateComponent('module', 'user', { crud: true });

  console.log('Testing generation of email queue in Fastify app...');
  await generateComponent('queue', 'email', {});
  
  // Reset
  process.cwd = originalCwd;
}

test().catch(console.error);
