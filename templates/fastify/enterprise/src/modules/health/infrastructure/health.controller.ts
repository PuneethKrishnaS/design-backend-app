import { FastifyRequest, FastifyReply } from 'fastify';

export class HealthController {
  public async check(request: FastifyRequest, reply: FastifyReply) {
    return { status: 'ok', message: 'API is healthy' };
  }
}
