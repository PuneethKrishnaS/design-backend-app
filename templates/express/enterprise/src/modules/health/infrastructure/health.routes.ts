import { Router } from 'express';
import { HealthController } from './health.controller';

export const healthRouter = Router();
const controller = new HealthController();

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
healthRouter.get('/', controller.getHealth.bind(controller));
