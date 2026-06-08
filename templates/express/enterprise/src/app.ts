// DB_IMPORT
// PLUGINS_IMPORT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './modules/health/infrastructure/health.routes';

dotenv.config();

const app = express();

// DB_INIT
// PLUGINS_INIT

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/health', healthRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
