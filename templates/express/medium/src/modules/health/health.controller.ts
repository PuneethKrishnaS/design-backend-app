import { Request, Response } from 'express';
import { getHealthStatus } from './health.service';

export const getHealth = (req: Request, res: Response) => {
  const status = getHealthStatus();
  res.json(status);
};
