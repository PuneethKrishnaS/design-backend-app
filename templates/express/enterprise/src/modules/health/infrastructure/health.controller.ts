import { Request, Response } from 'express';

export class HealthController {
  public getHealth(req: Request, res: Response) {
    res.json({ status: 'ok', message: 'API is healthy' });
  }
}
