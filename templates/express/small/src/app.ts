// DB_IMPORT
// PLUGINS_IMPORT
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import indexRoutes from './routes/index';

dotenv.config();

const app = express();

// DB_INIT
// PLUGINS_INIT

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api', indexRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
