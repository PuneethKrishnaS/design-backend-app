import { FastifyInstance } from 'fastify';
import { getHealth } from './health.controller';

export async function healthRouter(fastify: FastifyInstance) {
  fastify.get('/', getHealth);
}
