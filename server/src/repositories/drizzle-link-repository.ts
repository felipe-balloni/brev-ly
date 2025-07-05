import { eq, gte, type InferSelectModel } from 'drizzle-orm';
import type { Readable } from 'stream';
import { db, pg } from '@/db/index.js';
import { urls } from '@/db/schema/urls.js';
import type {
    CreateLinkDTO,
    LinkResponseDTO,
    UpdateLinkDTO,
} from '@/dtos/link.js';
import type { LinkRepositoryInterface } from '@/repositories/link-interface.js';

export class DrizzleLinkRepository implements LinkRepositoryInterface {
    async findByShortenedUrl(
        shortenedUrl: string,
    ): Promise<LinkResponseDTO | null> {
        const result = await db
            .select()
            .from(urls)
            .where(eq(urls.shortenedUrl, shortenedUrl))
            .limit(1);

        if (!result[0]) return null;

        return this.mapToDTO(result[0]);
    }

    async findById(id: string): Promise<LinkResponseDTO | null> {
        const result = await db
            .select()
            .from(urls)
            .where(eq(urls.id, id))
            .limit(1);

        if (!result[0]) return null;

        return this.mapToDTO(result[0]);
    }

    async create(data: CreateLinkDTO): Promise<LinkResponseDTO> {
        const result = await db
            .insert(urls)
            .values({
                originalUrl: data.originalUrl,
                shortenedUrl: data.shortenedUrl,
            })
            .returning();

        return this.mapToDTO(result[0]);
    }

    async update(id: string, data: UpdateLinkDTO): Promise<LinkResponseDTO> {
        const updateData: Partial<{
            originalUrl: string;
            shortenedUrl: string;
        }> = {};

        if (data.originalUrl !== undefined) {
            updateData.originalUrl = data.originalUrl;
        }

        if (data.shortenedUrl !== undefined) {
            updateData.shortenedUrl = data.shortenedUrl;
        }

        const result = await db
            .update(urls)
            .set(updateData)
            .where(eq(urls.id, id))
            .returning();

        if (!result.length) {
            throw new Error('Link not found');
        }

        return this.mapToDTO(result[0]);
    }

    async delete(id: string): Promise<void> {
        await db.delete(urls).where(eq(urls.id, id));
    }

    async incrementAccessCount(shortenedUrl: string): Promise<void> {
        const result = await db
            .select({ accessCount: urls.accessCount })
            .from(urls)
            .where(eq(urls.shortenedUrl, shortenedUrl))
            .limit(1);
        const current = result[0]?.accessCount ?? 0;

        await db
            .update(urls)
            .set({ accessCount: current + 1 })
            .where(eq(urls.shortenedUrl, shortenedUrl));
    }

    async getAccessCount(shortenedUrl: string): Promise<number> {
        const result = await db
            .select({ accessCount: urls.accessCount })
            .from(urls)
            .where(eq(urls.shortenedUrl, shortenedUrl))
            .limit(1);

        return result[0]?.accessCount ?? 0;
    }

    async getAllLinks(
        limit: number = 20,
        cursor?: string,
    ): Promise<{ links: LinkResponseDTO[]; nextCursor?: string }> {
        let query = db
            .select({
                id: urls.id,
                originalUrl: urls.originalUrl,
                shortenedUrl: urls.shortenedUrl,
                accessCount: urls.accessCount,
                createdAt: urls.createdAt,
            })
            .from(urls)
            .orderBy(urls.id)
            .limit(limit + 1);

        if (cursor) {
            // @ts-ignore
            query = query.where(gte(urls.id, cursor));
        }

        const result = await query;
        const hasNextPage = result.length > limit;
        const links = result.slice(0, limit).map(this.mapToDTO);
        const nextCursor = hasNextPage ? String(result[limit].id) : undefined;
        return { links, nextCursor };
    }

    async streamAllLinks(): Promise<Readable> {
        return await pg`
            copy (
                select 
                    original_url as "Original URL",
                    shortened_url as "Shortened URL",
                    access_count as "Access Count",
                    created_at as "Created At"
                from urls
                order by id asc
            ) to stdout with (format csv, header true)
        `.readable();
    }

    private mapToDTO(row: InferSelectModel<typeof urls>): LinkResponseDTO {
        return {
            id: row.id,
            originalUrl: row.originalUrl,
            shortenedUrl: row.shortenedUrl,
            accessCount: row.accessCount,
            createdAt: row.createdAt,
        };
    }
}
