import { stringify } from 'csv-stringify';
import type { Readable } from 'stream';
import { uuidv7 } from 'uuidv7';
import type { CreateLinkDTO, LinkResponseDTO, UpdateLinkDTO } from '@/dtos/link.js';
import type { LinkRepositoryInterface } from './link-interface.js';

function generateId() {
    return uuidv7();
}

export class MemoryLinkRepository implements LinkRepositoryInterface {
    private links: LinkResponseDTO[] = [];

    async findByShortenedUrl(
        shortenedUrl: string,
    ): Promise<LinkResponseDTO | null> {
        return this.links.find(l => l.shortenedUrl === shortenedUrl) || null;
    }

    async findById(
        id: string,
    ): Promise<LinkResponseDTO | null> {
        return this.links.find(l => l.id === id) || null;
    }

    async create(data: CreateLinkDTO): Promise<LinkResponseDTO> {
        const now = new Date();
        const link: LinkResponseDTO = {
            id: generateId(),
            originalUrl: data.originalUrl,
            shortenedUrl: data.shortenedUrl,
            accessCount: 0,
            createdAt: now,
        };
        this.links.push(link);
        return link;
    }

    async update(id: string, data: UpdateLinkDTO): Promise<LinkResponseDTO> {
        const linkIndex = this.links.findIndex(l => l.id === id);

        if (linkIndex === -1) {
            throw new Error('Link not found');
        }

        const link = { ...this.links[linkIndex] };
        const originalShortenedUrl = link.shortenedUrl;

        if (data.originalUrl !== undefined) {
            link.originalUrl = data.originalUrl;
        }

        if (data.shortenedUrl !== undefined) {
            link.shortenedUrl = data.shortenedUrl;
        }

        // If shortenedUrl is changed, remove the old link and add the updated one
        if (data.shortenedUrl !== undefined && data.shortenedUrl !== originalShortenedUrl) {
            this.links.splice(linkIndex, 1);
            this.links.push(link);
        } else {
            this.links[linkIndex] = link;
        }

        return link;
    }

    async delete(id: string): Promise<void> {
        this.links = this.links.filter(l => l.id !== id);
    }

    async incrementAccessCount(shortenedUrl: string): Promise<void> {
        const link = this.links.find(l => l.shortenedUrl === shortenedUrl);
        if (link) link.accessCount++;
    }

    async getAccessCount(shortenedUrl: string): Promise<number> {
        const link = this.links.find(l => l.shortenedUrl === shortenedUrl);
        return link ? link.accessCount : 0;
    }

    async getAllLinks(limit: number = 20, cursor?: string) {
        const sorted = [...this.links].sort((a, b) => a.id.localeCompare(b.id));

        let filtered = sorted;

        if (cursor) {
            filtered = sorted.filter(l => l.id > cursor);
        }

        const paginated = filtered.slice(0, limit + 1);
        const hasNextPage = paginated.length > limit;
        const links = paginated.slice(0, limit);
        const nextCursor = hasNextPage ? paginated[limit].id : undefined;

        return { links, nextCursor };
    }

    async streamAllLinks(): Promise<Readable> {
        const csvStream = stringify({
            header: true,
            columns: [
                { key: 'originalUrl', header: 'Original URL' },
                { key: 'shortenedUrl', header: 'Shortened URL' },
                { key: 'accessCount', header: 'Access Count' },
                { key: 'createdAt', header: 'Created At' },
            ],
        });

        for (const link of this.links) {
            csvStream.write({
                originalUrl: link.originalUrl,
                shortenedUrl: link.shortenedUrl,
                accessCount: link.accessCount,
                createdAt: link.createdAt,
            });
        }

        csvStream.end();

        return csvStream;
    }
}
