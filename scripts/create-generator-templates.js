const fs = require('fs-extra');
const path = require('path');

async function createGeneratorTemplates() {
  const baseDir = path.join(__dirname, '..', 'templates', 'express', 'generators');
  await fs.ensureDir(baseDir);

  // 1. Functional Controller (Small/Medium Scale)
  const controllerEjs = `import { Request, Response } from 'express';

<% if (crud) { %>
export const create<%= ModuleName %> = async (req: Request, res: Response) => {
  res.status(201).json({ message: 'Create <%= moduleName %>' });
};

export const get<%= ModuleName %>s = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all <%= moduleName %>s' });
};

export const get<%= ModuleName %>ById = async (req: Request, res: Response) => {
  res.status(200).json({ message: \`Get <%= moduleName %> \${req.params.id}\` });
};

export const update<%= ModuleName %> = async (req: Request, res: Response) => {
  res.status(200).json({ message: \`Update <%= moduleName %> \${req.params.id}\` });
};

export const delete<%= ModuleName %> = async (req: Request, res: Response) => {
  res.status(204).send();
};
<% } else { %>
export const example<%= ModuleName %>Action = async (req: Request, res: Response) => {
  res.status(200).json({ message: '<%= moduleName %> action successful' });
};
<% } %>
`;
  await fs.writeFile(path.join(baseDir, 'controller.ejs'), controllerEjs);

  // 2. Functional Route (Small/Medium Scale)
  const routeEjs = `import { Router } from 'express';
<% if (crud) { %>import { create<%= ModuleName %>, get<%= ModuleName %>s, get<%= ModuleName %>ById, update<%= ModuleName %>, delete<%= ModuleName %> } from './<%= moduleName %>.controller';<% } else { %>import { example<%= ModuleName %>Action } from './<%= moduleName %>.controller';<% } %>

export const <%= moduleName %>Router = Router();

<% if (crud) { %>
<%= moduleName %>Router.post('/', create<%= ModuleName %>);
<%= moduleName %>Router.get('/', get<%= ModuleName %>s);
<%= moduleName %>Router.get('/:id', get<%= ModuleName %>ById);
<%= moduleName %>Router.put('/:id', update<%= ModuleName %>);
<%= moduleName %>Router.delete('/:id', delete<%= ModuleName %>);
<% } else { %>
<%= moduleName %>Router.get('/', example<%= ModuleName %>Action);
<% } %>
`;
  await fs.writeFile(path.join(baseDir, 'route.ejs'), routeEjs);

  // 3. Functional Service (Medium Scale)
  const serviceEjs = `
<% if (crud) { %>
export const create<%= ModuleName %>Service = async (data: any) => {
  return { id: 1, ...data };
};

export const get<%= ModuleName %>sService = async () => {
  return [];
};

export const get<%= ModuleName %>ByIdService = async (id: string) => {
  return { id };
};

export const update<%= ModuleName %>Service = async (id: string, data: any) => {
  return { id, ...data };
};

export const delete<%= ModuleName %>Service = async (id: string) => {
  return true;
};
<% } else { %>
export const perform<%= ModuleName %>Service = async () => {
  return { success: true };
};
<% } %>
`;
  await fs.writeFile(path.join(baseDir, 'service.ejs'), serviceEjs);

  // 4. Class Controller (Enterprise Scale)
  const controllerClassEjs = `import { Request, Response } from 'express';

export class <%= ModuleName %>Controller {
<% if (crud) { %>
  public async create(req: Request, res: Response) {
    res.status(201).json({ message: 'Create <%= moduleName %>' });
  }

  public async getAll(req: Request, res: Response) {
    res.status(200).json({ message: 'Get all <%= moduleName %>s' });
  }

  public async getById(req: Request, res: Response) {
    res.status(200).json({ message: \`Get <%= moduleName %> \${req.params.id}\` });
  }

  public async update(req: Request, res: Response) {
    res.status(200).json({ message: \`Update <%= moduleName %> \${req.params.id}\` });
  }

  public async delete(req: Request, res: Response) {
    res.status(204).send();
  }
<% } else { %>
  public async handle(req: Request, res: Response) {
    res.status(200).json({ message: '<%= moduleName %> handled' });
  }
<% } %>
}
`;
  await fs.writeFile(path.join(baseDir, 'controller.class.ejs'), controllerClassEjs);

  // 5. Class Route (Enterprise Scale)
  const routeClassEjs = `import { Router } from 'express';
import { <%= ModuleName %>Controller } from './<%= moduleName %>.controller';

export const <%= moduleName %>Router = Router();
const controller = new <%= ModuleName %>Controller();

<% if (crud) { %>
<%= moduleName %>Router.post('/', controller.create.bind(controller));
<%= moduleName %>Router.get('/', controller.getAll.bind(controller));
<%= moduleName %>Router.get('/:id', controller.getById.bind(controller));
<%= moduleName %>Router.put('/:id', controller.update.bind(controller));
<%= moduleName %>Router.delete('/:id', controller.delete.bind(controller));
<% } else { %>
<%= moduleName %>Router.get('/', controller.handle.bind(controller));
<% } %>
`;
  await fs.writeFile(path.join(baseDir, 'route.class.ejs'), routeClassEjs);

  // 6. Class Service (Enterprise Scale)
  const serviceClassEjs = `
export class <%= ModuleName %>Service {
<% if (crud) { %>
  public async create(data: any) {
    return { id: 'uuid', ...data };
  }

  public async findAll() {
    return [];
  }

  public async findById(id: string) {
    return { id };
  }

  public async update(id: string, data: any) {
    return { id, ...data };
  }

  public async delete(id: string) {
    return true;
  }
<% } else { %>
  public async execute() {
    return { success: true };
  }
<% } %>
}
`;
  await fs.writeFile(path.join(baseDir, 'service.class.ejs'), serviceClassEjs);

  // ------------------------------------------------------------------------------------------------
  // COMMON GENERATOR TEMPLATES (Queue, Upload, etc.)
  // ------------------------------------------------------------------------------------------------
  const queueEjs = `import { createQueue, createQueueEvents } from '../config/queue';

export const <%= moduleName %>Queue = createQueue('<%= moduleName %>');
export const <%= moduleName %>QueueEvents = createQueueEvents('<%= moduleName %>');

export const add<%= ModuleName %>Job = async (data: any) => {
  return await <%= moduleName %>Queue.add('<%= moduleName %>Job', data);
};
`;
  
  const workerEjs = `import { Job } from 'bullmq';

export default async function (job: Job) {
  console.log(\`Processing <%= moduleName %> job: \${job.id}\`);
  // Add your background job logic here
  return { success: true };
}
`;

  const uploadEjs = `import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client } from '../config/s3';

export const upload<%= ModuleName %> = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET || 'my-bucket',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, \`<%= moduleName %>s/\${Date.now().toString()}-\${file.originalname}\`);
    }
  })
});
`;

  const authEjs = `import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
  // Add your user registration logic here
  res.status(201).json({ message: 'User registered successfully' });
};

export const login = async (req: Request, res: Response) => {
  // Add your user login logic here (e.g. verify password, issue token/session)
  res.status(200).json({ message: 'User logged in successfully', token: 'dummy-token' });
};

export const logout = async (req: Request, res: Response) => {
  // Add your logout logic here
  res.status(200).json({ message: 'User logged out successfully' });
};
`;

  // Write to Express generators
  await fs.writeFile(path.join(baseDir, 'queue.ejs'), queueEjs);
  await fs.writeFile(path.join(baseDir, 'worker.ejs'), workerEjs);
  await fs.writeFile(path.join(baseDir, 'upload.ejs'), uploadEjs);
  await fs.writeFile(path.join(baseDir, 'auth.ejs'), authEjs);

  console.log('Express generator templates created.');

  // ------------------------------------------------------------------------------------------------
  // FASTIFY GENERATOR TEMPLATES
  // ------------------------------------------------------------------------------------------------
  const fastifyBaseDir = path.join(__dirname, '..', 'templates', 'fastify', 'generators');
  await fs.ensureDir(fastifyBaseDir);

  // Write to Fastify generators
  await fs.writeFile(path.join(fastifyBaseDir, 'queue.ejs'), queueEjs);
  await fs.writeFile(path.join(fastifyBaseDir, 'worker.ejs'), workerEjs);
  await fs.writeFile(path.join(fastifyBaseDir, 'upload.ejs'), uploadEjs);

  // 1. Fastify Controller
  const fastifyControllerEjs = `import { FastifyRequest, FastifyReply } from 'fastify';

<% if (crud) { %>
export const create<%= ModuleName %> = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.code(201).send({ message: 'Create <%= moduleName %>' });
};

export const get<%= ModuleName %>s = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.code(200).send({ message: 'Get all <%= moduleName %>s' });
};

export const get<%= ModuleName %>ById = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  reply.code(200).send({ message: \`Get <%= moduleName %> \${request.params.id}\` });
};

export const update<%= ModuleName %> = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  reply.code(200).send({ message: \`Update <%= moduleName %> \${request.params.id}\` });
};

export const delete<%= ModuleName %> = async (request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) => {
  reply.code(204).send();
};
<% } else { %>
export const example<%= ModuleName %>Action = async (request: FastifyRequest, reply: FastifyReply) => {
  reply.code(200).send({ message: '<%= moduleName %> action successful' });
};
<% } %>
`;
  await fs.writeFile(path.join(fastifyBaseDir, 'controller.ejs'), fastifyControllerEjs);

  // 2. Fastify Route
  const fastifyRouteEjs = `import { FastifyInstance } from 'fastify';
<% if (crud) { %>import { create<%= ModuleName %>, get<%= ModuleName %>s, get<%= ModuleName %>ById, update<%= ModuleName %>, delete<%= ModuleName %> } from './<%= moduleName %>.controller';<% } else { %>import { example<%= ModuleName %>Action } from './<%= moduleName %>.controller';<% } %>

export async function <%= moduleName %>Router(fastify: FastifyInstance) {
<% if (crud) { %>
  fastify.post('/', create<%= ModuleName %>);
  fastify.get('/', get<%= ModuleName %>s);
  fastify.get('/:id', get<%= ModuleName %>ById);
  fastify.put('/:id', update<%= ModuleName %>);
  fastify.delete('/:id', delete<%= ModuleName %>);
<% } else { %>
  fastify.get('/', example<%= ModuleName %>Action);
<% } %>
}
`;
  await fs.writeFile(path.join(fastifyBaseDir, 'route.ejs'), fastifyRouteEjs);

  // 3. Fastify Service (same as express)
  await fs.writeFile(path.join(fastifyBaseDir, 'service.ejs'), serviceEjs);

  // 4. Fastify Class Controller
  const fastifyControllerClassEjs = `import { FastifyRequest, FastifyReply } from 'fastify';

export class <%= ModuleName %>Controller {
<% if (crud) { %>
  public async create(request: FastifyRequest, reply: FastifyReply) {
    reply.code(201).send({ message: 'Create <%= moduleName %>' });
  }

  public async getAll(request: FastifyRequest, reply: FastifyReply) {
    reply.code(200).send({ message: 'Get all <%= moduleName %>s' });
  }

  public async getById(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
    reply.code(200).send({ message: \`Get <%= moduleName %> \${request.params.id}\` });
  }

  public async update(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
    reply.code(200).send({ message: \`Update <%= moduleName %> \${request.params.id}\` });
  }

  public async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
    reply.code(204).send();
  }
<% } else { %>
  public async handle(request: FastifyRequest, reply: FastifyReply) {
    reply.code(200).send({ message: '<%= moduleName %> handled' });
  }
<% } %>
}
`;
  await fs.writeFile(path.join(fastifyBaseDir, 'controller.class.ejs'), fastifyControllerClassEjs);

  // 5. Fastify Class Route
  const fastifyRouteClassEjs = `import { FastifyInstance } from 'fastify';
import { <%= ModuleName %>Controller } from './<%= moduleName %>.controller';

export async function <%= moduleName %>Router(fastify: FastifyInstance) {
  const controller = new <%= ModuleName %>Controller();

<% if (crud) { %>
  fastify.post('/', controller.create.bind(controller));
  fastify.get('/', controller.getAll.bind(controller));
  fastify.get('/:id', controller.getById.bind(controller));
  fastify.put('/:id', controller.update.bind(controller));
  fastify.delete('/:id', controller.delete.bind(controller));
<% } else { %>
  fastify.get('/', controller.handle.bind(controller));
<% } %>
}
`;
  await fs.writeFile(path.join(fastifyBaseDir, 'route.class.ejs'), fastifyRouteClassEjs);

  // 6. Fastify Class Service (same as express)
  await fs.writeFile(path.join(fastifyBaseDir, 'service.class.ejs'), serviceClassEjs);

  console.log('Generator templates created.');
}

createGeneratorTemplates().catch(console.error);
