import { eq } from 'drizzle-orm';
import Fastify from 'fastify';
import {
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/index.js';
import { urls } from '@/db/schema/urls.js';
import type { LinkResponseDTO } from '@/dtos/link.js';
import { linksController } from './controller.js';

// Mock only the uploadFileToStorage function
vi.mock('@/services/upload-file-to-storage.js', () => {
    return {
        uploadFileToStorage: vi
            .fn()
            .mockImplementation(async ({ folder, fileName }) => {
                const uniqueFilename = `${folder}/mocked-uuid-${fileName}`;
                const url = `https://mocked-cdn.example.com/${uniqueFilename}`;

                return {
                    key: uniqueFilename,
                    url,
                };
            }),
    };
});

function buildApp() {
    const app = Fastify();

    // Set up Zod schema validation
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(linksController);
    return app;
}

describe('Links Controller', () => {
    let app: ReturnType<typeof buildApp>;

    beforeEach(async () => {
        await db.delete(urls);

        vi.clearAllMocks();
        app = buildApp();

        await app.ready();
    });

    describe('POST /links', () => {
        it('should create a new link and return 201', async () => {
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'example',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/links',
                payload: linkData,
            });

            expect(response.statusCode).toBe(201);

            const responseJson = response.json();
            expect(responseJson).toHaveProperty('id');
            expect(responseJson.originalUrl).toBe(linkData.originalUrl);
            expect(responseJson.shortenedUrl).toBe(linkData.shortenedUrl);
            expect(responseJson.accessCount).toBe(0);
            expect(responseJson).toHaveProperty('createdAt');

            // Verify the link was actually created in the database
            const dbLink = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);
            expect(dbLink).not.toBeNull();
            expect(dbLink?.originalUrl).toBe(linkData.originalUrl);
        });

        it('should return 409 when shortened URL already exists', async () => {
            // First, create a link
            const existingLink = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'duplicate',
            };

            await db.insert(urls).values(existingLink);

            // Try to create another link with the same shortened URL
            const response = await app.inject({
                method: 'POST',
                url: '/links',
                payload: existingLink,
            });

            expect(response.statusCode).toBe(409);
            expect(response.json()).toHaveProperty(
                'message',
                'Shortened URL already exists',
            );
        });

        it('should return 400 for invalid data', async () => {
            const invalidData = {
                originalUrl: 'not-a-url',
                shortenedUrl: 'example',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/links',
                payload: invalidData,
            });

            expect(response.statusCode).toBe(400);
        });

        it('should return 400 for shortened url to long', async () => {
            const invalidData = {
                originalUrl: 'https://example.com',
                shortenedUrl: '123456789123456789', //too long
            };

            const response = await app.inject({
                method: 'POST',
                url: '/links',
                payload: invalidData,
            });

            expect(response.statusCode).toBe(400);
            expect(response.json()).toHaveProperty(
                'message',
                'body/shortenedUrl String must contain at most 10 character(s)',
            );
        });
    });

    describe('DELETE /links/:shortenedUrl', () => {
        it('should delete a link and return 204', async () => {
            // First, create a link to delete
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'to-delete',
            };

            await db.insert(urls).values(linkData);

            // Verify the link exists
            const linkBeforeDelete = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);
            expect(linkBeforeDelete).not.toBeNull();

            // Delete the link
            const response = await app.inject({
                method: 'DELETE',
                url: `/links/${linkData.shortenedUrl}`,
            });

            expect(response.statusCode).toBe(204);

            // Verify the link was deleted
            const linkAfterDelete = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);
            expect(linkAfterDelete).toBeUndefined();
        });

        it('should return 404 when link does not exist', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/links/nonexistent',
            });

            expect(response.statusCode).toBe(404);
            expect(response.json()).toHaveProperty('message', 'Link not found');
        });
    });

    describe('GET /links/:shortenedUrl', () => {
        it('should return the original URL', async () => {
            // First, create a link
            const linkData = {
                originalUrl: 'https://example.com/long-path',
                shortenedUrl: 'get-test',
            };

            await db.insert(urls).values(linkData);

            // Get the original URL
            const response = await app.inject({
                method: 'GET',
                url: `/links/${linkData.shortenedUrl}`,
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({
                originalUrl: linkData.originalUrl,
            });
        });

        it('should return 404 when link does not exist', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/links/nonexistent',
            });

            expect(response.statusCode).toBe(404);
            expect(response.json()).toHaveProperty('message', 'Link not found');
        });
    });

    describe('GET /links', () => {
        it('should return a list of links', async () => {
            // Insert some test links
            const testLinks = [
                {
                    originalUrl: 'https://example.com',
                    shortenedUrl: 'list-test-1',
                    accessCount: 5,
                },
                {
                    originalUrl: 'https://another.com',
                    shortenedUrl: 'list-test-2',
                    accessCount: 10,
                },
            ];

            for (const link of testLinks) {
                await db.insert(urls).values(link);
            }

            const response = await app.inject({
                method: 'GET',
                url: '/links',
            });

            expect(response.statusCode).toBe(200);

            const responseJson = response.json();
            expect(Array.isArray(responseJson.links)).toBe(true);
            expect(responseJson.links.length).toBeGreaterThanOrEqual(2);
            expect(responseJson.nextCursor).toBeUndefined;

            // Check if our test links are in the response
            const foundLinks = responseJson.links.filter(
                (link: LinkResponseDTO) =>
                    testLinks.some(
                        testLink => testLink.shortenedUrl === link.shortenedUrl,
                    ),
            );
            expect(foundLinks.length).toBe(testLinks.length);

            // Verify properties of returned links
            for (const link of foundLinks) {
                expect(link).toHaveProperty('id');
                expect(link).toHaveProperty('originalUrl');
                expect(link).toHaveProperty('shortenedUrl');
                expect(link).toHaveProperty('accessCount');
                expect(link).toHaveProperty('createdAt');
            }
        });

        it('should support pagination parameters', async () => {
            // Insert some test links for pagination
            const testLinks = [
                {
                    originalUrl: 'https://page1.com',
                    shortenedUrl: 'page-test-1',
                },
                {
                    originalUrl: 'https://page2.com',
                    shortenedUrl: 'page-test-2',
                },
                {
                    originalUrl: 'https://page3.com',
                    shortenedUrl: 'page-test-3',
                },
            ];

            for (const link of testLinks) {
                await db.insert(urls).values(link);
            }

            // Get the first page with limit=1
            const firstPageResponse = await app.inject({
                method: 'GET',
                url: '/links?limit=1',
            });

            expect(firstPageResponse.statusCode).toBe(200);
            const firstPage = firstPageResponse.json();
            expect(Array.isArray(firstPage.links)).toBe(true);
            expect(firstPage.links.length).toBe(1);
            expect(firstPage.nextCursor).toBeDefined;

            // Use the ID of the first link as a cursor for the next page
            const cursor = firstPage.nextCursor;

            // Get the second page
            const secondPageResponse = await app.inject({
                method: 'GET',
                url: `/links?limit=1&cursor=${cursor}`,
            });

            expect(secondPageResponse.statusCode).toBe(200);
            const secondPage = secondPageResponse.json();
            expect(Array.isArray(secondPage.links)).toBe(true);
            expect(secondPage.links.length).toBe(1);
            expect(secondPage.nextCursor).toBeDefined;

            // Verify the first and second page has different links
            expect(firstPage.links[0].id).not.toBe(secondPage.links[0].id);
        });
    });

    describe('PATCH /links/:shortenedUrl', () => {
        it('should update originalUrl and return 200', async () => {
            // First, create a link
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'update-test-1',
                accessCount: 0,
            };

            await db.insert(urls).values(linkData);

            // Update only the originalUrl
            const updateData = {
                originalUrl: 'https://updated-example.com',
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/links/${linkData.shortenedUrl}`,
                payload: updateData,
            });

            expect(response.statusCode).toBe(200);

            const responseJson = response.json();
            expect(responseJson.originalUrl).toBe(updateData.originalUrl);
            expect(responseJson.shortenedUrl).toBe(linkData.shortenedUrl);

            // Verify the link was actually updated in the database
            const dbLink = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(dbLink).not.toBeNull();
            expect(dbLink?.originalUrl).toBe(updateData.originalUrl);
        });

        it('should update shortenedUrl and return 200', async () => {
            // First, create a link
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'update-test-2',
                accessCount: 0,
            };

            await db.insert(urls).values(linkData);

            // Update only the shortenedUrl
            const updateData = {
                shortenedUrl: 'updated-2',
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/links/${linkData.shortenedUrl}`,
                payload: updateData,
            });

            expect(response.statusCode).toBe(200);

            const responseJson = response.json();
            expect(responseJson.originalUrl).toBe(linkData.originalUrl);
            expect(responseJson.shortenedUrl).toBe(updateData.shortenedUrl);

            // Verify the link was actually updated in the database
            const dbLink = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, updateData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(dbLink).not.toBeNull();
            expect(dbLink?.originalUrl).toBe(linkData.originalUrl);

            // Verify the old shortenedUrl no longer exists
            const oldLink = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(oldLink).toBeUndefined();
        });

        it('should update both fields and return 200', async () => {
            // First, create a link
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'update-test-3',
                accessCount: 0,
            };

            await db.insert(urls).values(linkData);

            // Update both fields
            const updateData = {
                originalUrl: 'https://updated-example.com',
                shortenedUrl: 'updated-3',
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/links/${linkData.shortenedUrl}`,
                payload: updateData,
            });

            expect(response.statusCode).toBe(200);

            const responseJson = response.json();
            expect(responseJson.originalUrl).toBe(updateData.originalUrl);
            expect(responseJson.shortenedUrl).toBe(updateData.shortenedUrl);

            // Verify the link was actually updated in the database
            const dbLink = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, updateData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(dbLink).not.toBeNull();
            expect(dbLink?.originalUrl).toBe(updateData.originalUrl);

            // Verify the old shortenedUrl no longer exists
            const oldLink = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(oldLink).toBeUndefined();
        });

        it('should return 409 when new shortenedUrl already exists', async () => {
            // First, create two links
            const link1 = {
                originalUrl: 'https://example1.com',
                shortenedUrl: 'update-test-4',
            };

            const link2 = {
                originalUrl: 'https://example2.com',
                shortenedUrl: 'exist-url',
            };

            await db.insert(urls).values(link1);
            await db.insert(urls).values(link2);

            // Try to update link1 with link2's shortenedUrl
            const updateData = {
                shortenedUrl: link2.shortenedUrl,
            };

            console.log(
                'Test: should return 409 when new shortenedUrl already exists',
            );
            console.log('link1:', link1);
            console.log('link2:', link2);
            console.log('updateData:', updateData);

            const response = await app.inject({
                method: 'PATCH',
                url: `/links/${link1.shortenedUrl}`,
                payload: updateData,
            });

            console.log('Response status:', response.statusCode);
            console.log('Response body:', response.json());

            expect(response.statusCode).toBe(409);
            expect(response.json()).toHaveProperty(
                'message',
                'Shortened URL already exists',
            );

            // Verify neither link was changed
            const dbLink1 = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, link1.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(dbLink1).not.toBeNull();
            expect(dbLink1?.originalUrl).toBe(link1.originalUrl);

            const dbLink2 = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, link2.shortenedUrl))
                .limit(1)
                .then(result => result[0]);

            expect(dbLink2).not.toBeNull();
            expect(dbLink2?.originalUrl).toBe(link2.originalUrl);
        });

        it('should return 404 when link does not exist', async () => {
            const updateData = {
                originalUrl: 'https://updated-example.com',
            };

            const response = await app.inject({
                method: 'PATCH',
                url: '/links/nonexistent',
                payload: updateData,
            });

            expect(response.statusCode).toBe(404);
            expect(response.json()).toHaveProperty('message', 'Link not found');
        });

        it('should return 400 for invalid data', async () => {
            // First, create a link
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'update-test-5',
            };

            await db.insert(urls).values(linkData);

            // Try to update with invalid data
            const invalidData = {
                originalUrl: 'not-a-url',
            };

            const response = await app.inject({
                method: 'PATCH',
                url: `/links/${linkData.shortenedUrl}`,
                payload: invalidData,
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('PATCH /links/:shortenedUrl/access', () => {
        it('should increment access count and return 204', async () => {
            // First, create a link
            const linkData = {
                originalUrl: 'https://example.com',
                shortenedUrl: 'access-test',
                accessCount: 0,
            };

            await db.insert(urls).values(linkData);

            // Verify the initial access count
            const linkBeforeIncrement = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);
            expect(linkBeforeIncrement?.accessCount).toBe(0);

            // Increment access count
            const response = await app.inject({
                method: 'PATCH',
                url: `/links/${linkData.shortenedUrl}/access`,
            });

            expect(response.statusCode).toBe(200);
            expect(response.payload).toEqual(linkData.originalUrl);

            // Verify access count was incremented
            const linkAfterIncrement = await db
                .select()
                .from(urls)
                .where(eq(urls.shortenedUrl, linkData.shortenedUrl))
                .limit(1)
                .then(result => result[0]);
            expect(linkAfterIncrement?.accessCount).toBe(1);
        });

        it('should return 404 when link does not exist', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/links/nonexistent/access',
            });

            expect(response.statusCode).toBe(404);
            expect(response.json()).toHaveProperty('message', 'Link not found');
        });
    });

    describe('GET /links/export', () => {
        it('should export links to CSV and return a CDN URL', async () => {
            // Insert some test links to be exported
            const testLinks = [
                {
                    originalUrl: 'https://export1.com',
                    shortenedUrl: 'export-test-1',
                },
                {
                    originalUrl: 'https://export2.com',
                    shortenedUrl: 'export-test-2',
                },
            ];

            for (const link of testLinks) {
                await db.insert(urls).values(link);
            }

            const response = await app.inject({
                method: 'GET',
                url: '/links/export',
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('reportUrl');
            expect(response.json().reportUrl).toContain(
                'https://mocked-cdn.example.com/',
            );
            expect(response.json().reportUrl).toContain(
                'downloads/mocked-uuid-links-',
            );
            expect(response.json().reportUrl).toContain('.csv');
        });
    });
});
