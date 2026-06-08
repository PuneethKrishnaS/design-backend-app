import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

const router = Router();

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
router.get('/health', getHealth);

export default router;
