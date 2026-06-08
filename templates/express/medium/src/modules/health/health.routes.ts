import { Router } from 'express';
import { getHealth } from './health.controller';

export const healthRouter = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Retrieve a health check
 *     description: Fetches health status of the server.
 *     responses:
 *       200:
 *         description: Successfully returned a health check.
 */
healthRouter.get('/', getHealth);
