import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DrizzleLinkRepository } from '@/repositories/drizzle-link-repository.js';
import { LinkService } from '@/services/link-service.js';
import { isLeft, isRight, unwrapEither } from '@/shared/either.js';

const createLinkBodySchema = z
    .object({
        originalUrl: z
            .string()
            .url()
            .describe('The original URL to be shortened.'),
        shortenedUrl: z
            .string()
            .min(3)
            .max(10)
            .regex(/^[a-zA-Z0-9-_]+$/)
            .describe(
                'Custom shortened URL (optional). If not provided, it will be generated automatically.',
            ),
    })
    .describe('Payload for creating a new shortened link.');

const updateLinkBodySchema = z
    .object({
        originalUrl: z
            .string()
            .url()
            .optional()
            .describe('The new original URL.'),
        shortenedUrl: z
            .string()
            .min(3)
            .max(10)
            .regex(/^[a-zA-Z0-9-_]+$/)
            .optional()
            .describe('The new shortened URL.'),
    })
    .refine(
        data =>
            data.originalUrl !== undefined || data.shortenedUrl !== undefined,
        {
            message: 'At least one field must be provided for update',
        },
    )
    .describe('Payload for updating an existing link.');

const linkResponseSchema = z
    .object({
        id: z.string().describe('Unique identifier for the link.'),
        originalUrl: z.string().url().describe('The original registered URL.'),
        shortenedUrl: z
            .string()
            .describe('The generated or provided shortened URL.'),
        accessCount: z
            .number()
            .describe('Number of times the link was accessed.'),
        createdAt: z
            .date()
            .describe('Date and time when the link was created.'),
    })
    .describe('Response containing the created link data.');

export async function linksController(app: FastifyInstance) {
    const service = new LinkService(new DrizzleLinkRepository());

    app.post(
        '/links',
        {
            schema: {
                summary: 'Create a new shortened link',
                description:
                    'Creates a new shortened link. Provide the original URL and, optionally, a custom shortened URL path.',
                tags: ['URLs'],
                body: createLinkBodySchema,
                response: {
                    201: linkResponseSchema,
                    409: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message indicating that the shortened URL already exists',
                                ),
                        })
                        .describe(
                            'Conflict error when the requested shortened URL is already in use',
                        ),
                    400: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message explaining the validation failure',
                                ),
                        })
                        .describe(
                            'Bad request error when the provided data is invalid',
                        ),
                    422: z
                        .object({
                            statusCode: z
                                .number()
                                .describe('HTTP status code (422)'),
                            error: z
                                .string()
                                .describe('Error type (Unprocessable Entity)'),
                            message: z
                                .string()
                                .describe('Detailed validation error message'),
                        })
                        .describe(
                            'Validation error captured by the global error handler when request data fails schema validation',
                        ),
                },
            },
        },
        async (request, reply) => {
            const parseResult = createLinkBodySchema.safeParse(request.body);

            if (!parseResult.success) {
                return reply
                    .status(400)
                    .send({ message: 'Invalid data for link creation.' });
            }

            const data = parseResult.data;
            const result = await service.createLink(data);

            if (isLeft(result)) {
                if (result.left.type === 'DUPLICATE_SHORTENED_URL') {
                    return reply
                        .status(409)
                        .send({ message: 'Shortened URL already exists' });
                }
            }

            return reply.status(201).send(unwrapEither(result));
        },
    );

    app.delete<{ Params: { shortenedUrl: string } }>(
        '/links/:shortenedUrl',
        {
            schema: {
                summary: 'Delete a shortened URL',
                description:
                    'Permanently removes a shortened URL from the system',
                tags: ['URLs'],
                params: z.object({
                    shortenedUrl: z
                        .string()
                        .describe('The shortened URL path to delete'),
                }),
                response: {
                    204: z.null().describe('Successful deletion (no content)'),
                    404: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message indicating that the link was not found',
                                ),
                        })
                        .describe(
                            'Error when the specified shortened URL does not exist',
                        ),
                },
            },
        },
        async (request, reply) => {
            const { shortenedUrl } = request.params;

            const result = await service.deleteLink(shortenedUrl);

            if (isLeft(result)) {
                return reply.status(404).send({ message: 'Link not found' });
            }

            return reply.status(204).send();
        },
    );

    app.get<{ Params: { shortenedUrl: string } }>(
        '/links/:shortenedUrl',
        {
            schema: {
                summary: 'Get the original URL by shortened URL',
                description:
                    'Retrieves the original URL associated with a shortened URL path',
                tags: ['URLs'],
                params: z.object({
                    shortenedUrl: z
                        .string()
                        .describe('The shortened URL path to look up'),
                }),
                response: {
                    200: z
                        .object({
                            originalUrl: z
                                .string()
                                .url()
                                .describe(
                                    'The original URL that the shortened URL redirects to',
                                ),
                        })
                        .describe('Successful response with the original URL'),
                    404: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message indicating that the link was not found',
                                ),
                        })
                        .describe(
                            'Error when the specified shortened URL does not exist',
                        ),
                },
            },
        },
        async (request, reply) => {
            const { shortenedUrl } = request.params;
            const result = await service.getOriginalUrl(shortenedUrl);

            if (!isRight(result)) {
                return reply.status(404).send({ message: 'Link not found' });
            }

            return reply
                .status(200)
                .send({ originalUrl: unwrapEither(result) });
        },
    );

    app.get<{ Querystring: { limit?: number; cursor?: string } }>(
        '/links',
        {
            schema: {
                summary: 'List all shortened URLs',
                description:
                    'Returns a paginated list of all shortened URLs with support for infinite scrolling',
                tags: ['URLs'],
                querystring: z.object({
                    limit: z.coerce
                        .number()
                        .optional()
                        .describe('Number of links to return (default: 20)'),
                    cursor: z
                        .string()
                        .optional()
                        .describe(
                            'Cursor for pagination (ID of the last link from previous page)',
                        ),
                }),
                response: {
                    200: z.object({
                        links: z
                            .array(linkResponseSchema)
                            .describe('List of shortened links'),
                        nextCursor: z
                            .string()
                            .optional()
                            .describe('Cursor for the next page of results'),
                    }),
                },
            },
        },
        async (request, reply) => {
            const { limit, cursor } = request.query;
            const links = await service.listLinks(limit, cursor);

            return reply.status(200).send(links);
        },
    );

    app.patch<{
        Params: { shortenedUrl: string };
        Body: { originalUrl?: string; shortenedUrl?: string };
    }>(
        '/links/:shortenedUrl',
        {
            schema: {
                summary: 'Update a shortened URL',
                description:
                    'Updates an existing shortened URL with new values for original URL and/or shortened URL',
                tags: ['URLs'],
                params: z.object({
                    shortenedUrl: z
                        .string()
                        .describe('The current shortened URL path to update'),
                }),
                body: updateLinkBodySchema,
                response: {
                    200: linkResponseSchema.describe('The updated link'),
                    400: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message explaining the validation failure',
                                ),
                        })
                        .describe(
                            'Bad request error when the provided data is invalid',
                        ),
                    404: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message indicating that the link was not found',
                                ),
                        })
                        .describe(
                            'Error when the specified shortened URL does not exist',
                        ),
                    409: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message indicating that the new shortened URL already exists',
                                ),
                        })
                        .describe(
                            'Conflict error when the requested shortened URL is already in use',
                        ),
                },
            },
        },
        async (request, reply) => {
            const { shortenedUrl } = request.params;
            console.log('PATCH /links/:shortenedUrl called with:', {
                shortenedUrl,
                body: request.body,
            });

            const parseResult = updateLinkBodySchema.safeParse(request.body);
            console.log('Parse result:', parseResult);

            if (!parseResult.success) {
                console.log('Validation failed:', parseResult.error);
                return reply
                    .status(400)
                    .send({ message: 'Invalid data for link update.' });
            }

            const data = parseResult.data;
            console.log('Parsed data:', data);

            const result = await service.updateLink(shortenedUrl, data);
            console.log('Service result:', result);

            if (isLeft(result)) {
                const error = result.left;
                console.log('Error from service:', error);

                if (error.type === 'NOT_FOUND') {
                    return reply
                        .status(404)
                        .send({ message: 'Link not found' });
                }

                if (error.type === 'DUPLICATE_SHORTENED_URL') {
                    return reply
                        .status(409)
                        .send({ message: 'Shortened URL already exists' });
                }

                return reply.status(400).send({
                    message:
                        error.type === 'INVALID_DATA'
                            ? error.message
                            : 'Invalid data for link update',
                });
            }

            return reply.status(200).send(unwrapEither(result));
        },
    );

    app.patch<{ Params: { shortenedUrl: string } }>(
        '/links/:shortenedUrl/access',
        {
            schema: {
                summary: 'Increment access count for a shortened URL',
                description:
                    'Increases the access counter for a shortened URL by one, typically called when the URL is visited',
                tags: ['URLs'],
                params: z.object({
                    shortenedUrl: z
                        .string()
                        .describe(
                            'The shortened URL path to increment access count for',
                        ),
                }),
                response: {
                    204: z
                        .string()
                        .url()
                        .describe('Original URL to be accessed'),
                    404: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message indicating that the link was not found',
                                ),
                        })
                        .describe(
                            'Error when the specified shortened URL does not exist',
                        ),
                },
            },
        },
        async (request, reply) => {
            const { shortenedUrl } = request.params;
            const result = await service.incrementAccessCount(shortenedUrl);

            if (isLeft(result)) {
                return reply.status(404).send({ message: 'Link not found' });
            }

            return reply.status(200).send(unwrapEither(result));
        },
    );

    app.get(
        '/links/export',
        {
            schema: {
                summary: 'Export all links to CSV',
                description:
                    'Exports all links to a CSV file and returns a URL to download the file. The export is processed efficiently using streaming for large datasets.',
                tags: ['URLs'],
                response: {
                    200: z
                        .object({
                            reportUrl: z
                                .string()
                                .url()
                                .describe(
                                    'CDN URL for downloading the exported CSV file',
                                ),
                        })
                        .describe(
                            'Successful export response with download URL',
                        ),
                    500: z
                        .object({
                            message: z
                                .string()
                                .describe(
                                    'Error message explaining why the export failed',
                                ),
                        })
                        .describe('Error response when export fails'),
                },
            },
        },
        async (_request, reply) => {
            const result = await service.exportLinksToCSVFile();

            if (isLeft(result)) {
                return reply
                    .status(500)
                    .send({ message: 'Failed to export links' });
            }

            return reply
                .status(200)
                .send({ reportUrl: unwrapEither(result).reportUrl });
        },
    );
}
