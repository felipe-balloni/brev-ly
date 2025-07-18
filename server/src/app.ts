import fastifyCors from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastify } from 'fastify';
import {
    hasZodFastifySchemaValidationErrors,
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import { env } from '@/env/index.js';
import { linksController } from '@/http/controllers/links/controller.js';

export const app = fastify();

await app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler((error, _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
        return reply
            .status(422)
            .send({ message: 'Validation error', issues: error.validation });
    }

    console.log(error);

    return reply.status(500).send({ message: 'Internal server error.' });
});

await app.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Brev.ly API',
            description: 'API for managing shortened links',
            version: '1.0.0',
        },
    },
    transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

await app.register(linksController);
