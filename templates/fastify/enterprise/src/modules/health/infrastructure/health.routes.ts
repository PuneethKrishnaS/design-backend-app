import { FastifyInstance } from 'fastify';
import { HealthController } from './health.controller';

export async function healthRouter(fastify: FastifyInstance) {
  const controller = new HealthController();
  fastify.get('/', controller.check.bind(controller));
}
