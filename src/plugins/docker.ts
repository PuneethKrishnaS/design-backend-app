import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const dockerPlugin: Plugin = {
  name: 'docker',
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    // 1. Create Dockerfile
    const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
`;
    await fs.writeFile(path.join(targetDir, 'Dockerfile'), dockerfile);

    // 2. Create .dockerignore
    const dockerignore = `node_modules
npm-debug.log
dist
.env
.git
`;
    await fs.writeFile(path.join(targetDir, '.dockerignore'), dockerignore);

    // 3. Create docker-compose.yml
    let composeContent = `version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
`;

    if (config.database === 'postgresql') {
      composeContent += `      - DATABASE_URL=postgresql://postgres:password@db:5432/${config.name}?schema=public
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=${config.name}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;
    } else if (config.database === 'mongodb') {
      composeContent += `      - MONGO_URI=mongodb://db:27017/${config.name}
    depends_on:
      - db

  db:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
`;
    }

    await fs.writeFile(path.join(targetDir, 'docker-compose.yml'), composeContent);
  }
};
