import { beforeEach, describe, expect, it, vi } from 'vitest';
import { populateLinks } from '@/db/factories.js';
import { db } from '@/db/index.js';
import { urls } from '@/db/schema/urls.js';
import type { CreateLinkDTO } from '@/dtos/link.js';
import { DrizzleLinkRepository } from '@/repositories/drizzle-link-repository.js';
import { isRight, unwrapEither } from '@/shared/either.js';
import { LinkService } from './link-service.js';

// Mock the uploadFileToStorage function
vi.mock('./upload-file-to-storage.js', () => ({
    uploadFileToStorage: vi.fn().mockImplementation(({ folder, fileName }) => {
        const mockKey = `${folder}/mock-uuid-${fileName}`;
        const mockUrl = `https://example.com/${mockKey}`;
        return Promise.resolve({ key: mockKey, url: mockUrl });
    }),
}));

const makeDTO = (overrides?: Partial<CreateLinkDTO>): CreateLinkDTO => ({
    originalUrl: 'https://example.com',
    shortenedUrl: 'abc123',
    ...overrides,
});

describe('LinkService', () => {
    let service: LinkService;

    beforeEach(async () => {
        service = new LinkService(new DrizzleLinkRepository());
        await db.delete(urls);

        // Reset all mocks before each test
        vi.clearAllMocks();
    });

    it('should create a link', async () => {
        const result = await service.createLink(makeDTO());

        expect(isRight(result)).toBe(true);

        if (isRight(result)) {
            expect(unwrapEither(result).originalUrl).toBe(
                'https://example.com',
            );

            expect(unwrapEither(result).shortenedUrl).toBe('abc123');
        }
    });

    it('should not create a link with duplicate shortenedUrl', async () => {
        await service.createLink(makeDTO());

        const result = await service.createLink(makeDTO());

        expect(isRight(result)).toBe(false);

        if (!isRight(result)) {
            expect(result.left.type).toBe('DUPLICATE_SHORTENED_URL');
        }
    });

    it('should delete a link and remove it from the list', async () => {
        await service.createLink(makeDTO());
        await service.createLink(makeDTO({ shortenedUrl: 'def456' }));

        let { links } = await service.listLinks();
        expect(links.length).toBe(2);

        await service.deleteLink('abc123');
        ({ links } = await service.listLinks());

        expect(links.length).toBe(1);
        expect(links[0].shortenedUrl).toBe('def456');
    });

    it('should not delete a non-existent link', async () => {
        const result = await service.deleteLink('notfound');

        expect(isRight(result)).toBe(false);

        if (!isRight(result)) {
            expect(result.left.type).toBe('NOT_FOUND');
        }
    });

    it('should get the original URL', async () => {
        await service.createLink(makeDTO());

        const result = await service.getOriginalUrl('abc123');

        expect(isRight(result)).toBe(true);

        if (isRight(result)) {
            expect(unwrapEither(result)).toBe('https://example.com');
        }
    });

    it('should not get original URL for non-existent link', async () => {
        const result = await service.getOriginalUrl('notfound');

        expect(isRight(result)).toBe(false);
    });

    it('should increment access count', async () => {
        await service.createLink(makeDTO());
        await service.incrementAccessCount('abc123');
        const { links } = await service.listLinks();
        expect(links[0].accessCount).toBe(1);
    });

    it('should not increment access count for non-existent link', async () => {
        const result = await service.incrementAccessCount('notfound');

        expect(isRight(result)).toBe(false);
    });

    it('should paginate links with cursor', async () => {
        await populateLinks(service, 25);

        const { links, nextCursor } = await service.listLinks(10);
        expect(links.length).toBe(10);
        expect(nextCursor).toBeDefined();

        const page2 = await service.listLinks(10, nextCursor);
        expect(page2.links.length).toBe(10);
        expect(page2.nextCursor).toBeDefined();

        const page3 = await service.listLinks(10, page2.nextCursor);
        expect(page3.links.length).toBe(5);
        expect(page3.nextCursor).toBeUndefined();
    });

    it('should export links as CSV stream', async () => {
        await populateLinks(service, 3);
        const stream = await service.exportLinksToCSVStream();
        let csv = '';
        for await (const chunk of stream) {
            csv += chunk.toString();
        }
        expect(csv).toContain('Original URL');
        expect(csv).toContain('short0');
        expect(csv).toContain('short1');
        expect(csv).toContain('short2');
    });

    it('should export links to CSV file and upload to storage using mock', async () => {
        const { uploadFileToStorage } = await import(
            './upload-file-to-storage.js'
        );

        await populateLinks(service, 10);

        const result = await service.exportLinksToCSVFile();

        expect(isRight(result)).toBe(true);

        if (isRight(result)) {
            const { reportUrl } = unwrapEither(result);

            expect(reportUrl).toBe(
                'https://example.com/downloads/mock-uuid-links-' +
                    reportUrl.split('links-')[1],
            );
            expect(reportUrl).toContain('links');
            expect(reportUrl).toContain('.csv');

            expect(uploadFileToStorage).toHaveBeenCalledWith(
                expect.objectContaining({
                    folder: 'downloads',
                    contentType: 'text/csv',
                }),
            );

            expect(uploadFileToStorage).toHaveBeenCalledTimes(1);
        }
    });

    it('should list all links', async () => {
        await service.createLink(makeDTO());
        await service.createLink(makeDTO({ shortenedUrl: 'def456' }));
        const { links } = await service.listLinks();
        expect(links.length).toBe(2);
    });

    it('should handle empty link list', async () => {
        const { links } = await service.listLinks();
        expect(links.length).toBe(0);
    });

    it('should handle empty link list with cursor', async () => {
        const { links, nextCursor } = await service.listLinks(10);
        expect(links.length).toBe(0);
        expect(nextCursor).toBeUndefined();
    });
});
