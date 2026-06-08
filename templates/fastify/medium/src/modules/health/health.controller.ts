import { FastifyRequest, FastifyReply } from 'fastify';

export const getHealth = async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'ok', message: 'API is healthy' };
};
