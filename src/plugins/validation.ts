import path from 'path';
import fs from 'fs-extra';
import { Plugin, PluginContext } from '../core/plugin';

export const validationPlugin: Plugin = {
  name: 'validation',
  execute: async (context: PluginContext) => {
    const { targetDir, config } = context;

    if (config.validation === 'zod') {
      validationPlugin.dependencies = { 'zod': '^3.23.4' };
      const middlewareDir = path.join(targetDir, 'src', 'middleware');
      await fs.ensureDir(middlewareDir);

      if (config.framework === 'express') {
        await fs.writeFile(path.join(middlewareDir, 'validate.ts'), `import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      return next(error);
    }
  };
};
`);
      } else if (config.framework === 'fastify') {
        // For fastify, they often use type providers or decorators, but a preHandler hook works perfectly.
        await fs.writeFile(path.join(middlewareDir, 'validate.ts'), `import { FastifyRequest, FastifyReply } from 'fastify';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await schema.parseAsync({
        body: request.body,
        query: request.query,
        params: request.params,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        reply.code(500).send({ error: 'Internal Server Error' });
      }
    }
  };
};
`);
      }
    } else if (config.validation === 'joi') {
      validationPlugin.dependencies = { 'joi': '^17.12.2' };
      const middlewareDir = path.join(targetDir, 'src', 'middleware');
      await fs.ensureDir(middlewareDir);

      if (config.framework === 'express') {
        await fs.writeFile(path.join(middlewareDir, 'validate.ts'), `import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    }, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details,
      });
    }
    next();
  };
};
`);
      } else if (config.framework === 'fastify') {
        await fs.writeFile(path.join(middlewareDir, 'validate.ts'), `import { FastifyRequest, FastifyReply } from 'fastify';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { error } = schema.validate({
      body: request.body,
      query: request.query,
      params: request.params,
    }, { abortEarly: false });

    if (error) {
      reply.code(400).send({
        error: 'Validation failed',
        details: error.details,
      });
    }
  };
};
`);
      }
    }
  }
};
