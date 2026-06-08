// DB_IMPORT
// PLUGINS_IMPORT
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { healthRouter } from './modules/health/infrastructure/health.routes';

dotenv.config();

const app = Fastify({ logger: true });

// DB_INIT
// PLUGINS_INIT

app.register(cors);
app.register(helmet);

app.register(healthRouter, { prefix: '/api/health' });

const start = async () => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
