import { input, select, confirm } from '@inquirer/prompts';

export interface ProjectConfig {
  name: string;
  framework: 'express' | 'fastify' | 'hono' | 'nestjs';
  language: 'typescript' | 'javascript';
  database: 'postgresql' | 'mongodb' | 'mysql' | 'none';
  orm: 'prisma' | 'mongoose' | 'sequelize' | 'typeorm' | 'none';
  auth: 'jwt' | 'session' | 'oauth' | 'none';
  validation: 'zod' | 'joi' | 'class-validator' | 'none';
  plugins: string[];
  scale: 'small' | 'medium' | 'enterprise';
  teamSize: '1-3' | '4-10' | '10+';
  expectedTraffic: 'low' | 'medium' | 'high';
  architecturePattern: 'mvc' | 'feature' | 'clean' | 'ddd' | 'hexagonal';
  rbac?: boolean;
  roles?: string[];
  useLatest?: boolean;
}

export async function askProjectQuestions(projectName?: string): Promise<ProjectConfig> {
  // 1. Project name?
  const name = projectName || (await input({
    message: 'Project name?',
    default: 'my-backend',
  }));

  // 2. Framework?
  const framework = await select({
    message: 'Framework?',
    choices: [
      { name: 'Express.js', value: 'express' },
      { name: 'Fastify', value: 'fastify' },
      { name: 'Hono (Coming Soon)', value: 'hono', disabled: true },
      { name: 'NestJS (Coming Soon)', value: 'nestjs', disabled: true },
    ],
  });

  // 3. Language?
  const language = await select({
    message: 'Language?',
    choices: [
      { name: 'TypeScript', value: 'typescript' },
      { name: 'JavaScript (Coming Soon)', value: 'javascript', disabled: true },
    ],
  });

  // 4. Database?
  const database = await select({
    message: 'Database?',
    choices: [
      { name: 'None (for now)', value: 'none' },
      { name: 'PostgreSQL', value: 'postgresql' },
      { name: 'MongoDB', value: 'mongodb' },
      { name: 'MySQL', value: 'mysql' },
    ],
  });

  // 5. ORM?
  let ormChoices = [
    { name: 'None', value: 'none' },
    { name: 'Prisma', value: 'prisma', disabled: (database !== 'postgresql' && database !== 'mysql') ? '(Requires PostgreSQL or MySQL)' : false },
    { name: 'Mongoose', value: 'mongoose', disabled: database !== 'mongodb' ? '(Requires MongoDB)' : false },
    { name: 'Sequelize', value: 'sequelize', disabled: (database !== 'postgresql' && database !== 'mysql') ? '(Requires PostgreSQL or MySQL)' : false },
    { name: 'TypeORM (Coming Soon)', value: 'typeorm', disabled: true },
  ];
  
  if (database === 'none') {
    ormChoices = [{ name: 'None', value: 'none' }];
  }

  const orm = await select({
    message: 'ORM?',
    choices: ormChoices,
  });

  // 6. Authentication?
  const auth = await select({
    message: 'Authentication?',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'JWT', value: 'jwt' },
      { name: 'Session Authentication', value: 'session' },
      { name: 'OAuth', value: 'oauth' },
    ],
  });

  let rbac = false;
  let roles: string[] = [];
  if (auth !== 'none') {
    rbac = await confirm({ message: 'Include Role-Based Access Control (RBAC)?' });
    if (rbac) {
      const rolesInput = await input({ 
        message: 'Define your roles (comma-separated, e.g. user,manager,admin):',
        default: 'user,admin'
      });
      roles = rolesInput.split(',').map(r => r.trim()).filter(r => r);
    }
  }

  // 7. Validation library?
  const validation = await select({
    message: 'Validation library?',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'Zod', value: 'zod' },
      { name: 'Joi', value: 'joi' },
      { name: 'Class Validator (Coming Soon)', value: 'class-validator', disabled: true },
    ],
  });

  const plugins: string[] = [];
  if (validation !== 'none') {
    plugins.push('validation');
  }

  // 8. Include Swagger?
  const useSwagger = await confirm({ message: 'Include Swagger?' });
  if (useSwagger) plugins.push('swagger');

  // 9. Include Docker?
  const useDocker = await confirm({ message: 'Include Docker?' });
  if (useDocker) plugins.push('docker');

  // 10. Include Redis?
  const useRedis = await confirm({ message: 'Include Redis?' });
  if (useRedis) plugins.push('redis');

  // 11. Include BullMQ?
  const useBullMQ = await confirm({ message: 'Include BullMQ?' });
  if (useBullMQ) {
    plugins.push('bullmq');
    if (!plugins.includes('redis')) {
      plugins.push('redis');
    }
  }

  const useAwsS3 = await confirm({ message: 'Include AWS S3?' });
  if (useAwsS3) plugins.push('aws-s3');

  const useNodemailer = await confirm({ message: 'Include Nodemailer?' });
  if (useNodemailer) plugins.push('nodemailer');

  const useCodeQuality = await confirm({ message: 'Include Code Quality Tools (ESLint, Prettier, Husky)?' });
  if (useCodeQuality) plugins.push('code-quality');

  const useLogger = await confirm({ message: 'Include Winston Logger?' });
  if (useLogger) plugins.push('logger');

  const useRateLimit = await confirm({ message: 'Include Rate Limiting?' });
  if (useRateLimit) plugins.push('rate-limit');

  // 12. Expected scale?
  const scale = await select({
    message: 'Expected scale?',
    choices: [
      { name: 'Small (Portfolio, Learning, simple CRUD)', value: 'small' },
      { name: 'Medium (Startups, Small teams, SaaS)', value: 'medium' },
      { name: 'Enterprise (Large teams, Microservices)', value: 'enterprise' },
    ],
  });

  // 13. Team size?
  const teamSize = await select({
    message: 'Team size?',
    choices: [
      { name: 'Solo / 1-3 developers', value: '1-3' },
      { name: '4-10 developers', value: '4-10' },
      { name: '10+ developers', value: '10+' },
    ],
  });

  // 14. Expected traffic?
  const expectedTraffic = await select({
    message: 'Expected traffic?',
    choices: [
      { name: 'Low (Internal tool, MVP)', value: 'low' },
      { name: 'Medium (Growing SaaS, B2B)', value: 'medium' },
      { name: 'High (Consumer app, Viral potential)', value: 'high' },
    ],
  });

  // 15. Architecture pattern?
  const defaultArchitecture = scale === 'small' ? 'mvc' : (scale === 'medium' ? 'feature' : 'clean');
  const architecturePattern = await select({
    message: 'Architecture pattern?',
    default: defaultArchitecture,
    choices: [
      { name: 'MVC', value: 'mvc' },
      { name: 'Feature-Based Architecture', value: 'feature' },
      { name: 'Clean Architecture', value: 'clean' },
      { name: 'Domain Driven Design (DDD)', value: 'ddd' },
      { name: 'Hexagonal Architecture', value: 'hexagonal' },
    ],
  });

  let finalScale = scale;
  if (architecturePattern === 'clean' || architecturePattern === 'ddd' || architecturePattern === 'hexagonal') {
    finalScale = 'enterprise';
  } else if (architecturePattern === 'feature') {
    finalScale = 'medium';
  } else if (architecturePattern === 'mvc') {
    finalScale = 'small';
  }

  return {
    name,
    framework: framework as any,
    language: language as any,
    database: database as any,
    orm: orm as any,
    auth: auth as any,
    rbac: rbac as any,
    roles: roles as any,
    validation: validation as any,
    plugins,
    scale: finalScale as any,
    teamSize: teamSize as any,
    expectedTraffic: expectedTraffic as any,
    architecturePattern: architecturePattern as any,
  };
}
