import { PassThrough, pipeline } from 'node:stream';
import { promisify } from 'node:util';
import type {
    CreateLinkDTO,
    LinkResponseDTO,
    UpdateLinkDTO,
} from '@/dtos/link.js';
import type { LinkRepositoryInterface } from '@/repositories/link-interface.js';
import { type Either, makeLeft, makeRight } from '@/shared/either.js';
import { uploadFileToStorage } from './upload-file-to-storage.js';

export type CreateLinkError =
    | { type: 'DUPLICATE_SHORTENED_URL' }
    | { type: 'INVALID_DATA'; message: string };

export type UpdateLinkError =
    | { type: 'NOT_FOUND' }
    | { type: 'DUPLICATE_SHORTENED_URL' }
    | { type: 'INVALID_DATA'; message: string };

export type DeleteLinkError = { type: 'NOT_FOUND' };
export type GetOriginalUrlError = { type: 'NOT_FOUND' };
export type IncrementAccessError = { type: 'NOT_FOUND' };
export type ExportLinksError = { message: string };

export class LinkService {
    constructor(private readonly repository: LinkRepositoryInterface) {}

    async createLink(
        data: CreateLinkDTO,
    ): Promise<Either<CreateLinkError, LinkResponseDTO>> {
        const existing = await this.repository.findByShortenedUrl(
            data.shortenedUrl,
        );

        if (existing) {
            return makeLeft({ type: 'DUPLICATE_SHORTENED_URL' });
        }

        const created = await this.repository.create(data);

        return makeRight(created);
    }

    async updateLink(
        shortenedUrl: string,
        data: UpdateLinkDTO,
    ): Promise<Either<UpdateLinkError, LinkResponseDTO>> {
        const existing = await this.repository.findByShortenedUrl(shortenedUrl);

        if (!existing) {
            return makeLeft({ type: 'NOT_FOUND' });
        }

        // If updating the shortenedUrl, check for conflicts
        if (data.shortenedUrl && data.shortenedUrl !== shortenedUrl) {
            const conflicting = await this.repository.findByShortenedUrl(
                data.shortenedUrl,
            );

            // Only consider it a conflict if it's a different link (different ID)
            if (conflicting && conflicting.id !== existing.id) {
                return makeLeft({ type: 'DUPLICATE_SHORTENED_URL' });
            }
        }

        try {
            const updated = await this.repository.update(existing.id, data);
            return makeRight(updated);
        } catch (error) {
            return makeLeft({
                type: 'INVALID_DATA',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error during update',
            });
        }
    }

    async deleteLink(
        shortenedUrl: string,
    ): Promise<Either<DeleteLinkError, void>> {
        const existing = await this.repository.findByShortenedUrl(shortenedUrl);

        if (!existing) {
            return makeLeft({ type: 'NOT_FOUND' });
        }

        await this.repository.delete(existing.id);

        return makeRight<void>(undefined);
    }

    async getOriginalUrl(
        shortenedUrl: string,
    ): Promise<Either<GetOriginalUrlError, string>> {
        const link = await this.repository.findByShortenedUrl(shortenedUrl);
        if (!link) {
            return makeLeft({ type: 'NOT_FOUND' });
        }
        return makeRight(link.originalUrl);
    }

    /**
     * Lista links paginados para scroll infinito.
     */
    async listLinks(limit: number = 20, cursor?: string) {
        return this.repository.getAllLinks(limit, cursor);
    }

    /**
     * Exporta todos os links em CSV via streaming.
     */
    async exportLinksToCSVStream() {
        return this.repository.streamAllLinks();
    }

    async incrementAccessCount(
        shortenedUrl: string,
    ): Promise<Either<IncrementAccessError, string>> {
        const link = await this.repository.findByShortenedUrl(shortenedUrl);

        if (!link) {
            return makeLeft({ type: 'NOT_FOUND' });
        }

        await this.repository.incrementAccessCount(shortenedUrl);

        return makeRight(link.originalUrl);
    }

    /**
     * Exporta todos os links em CSV para um arquivo no storage, de forma segura e eficiente para grandes volumes.
     * Utiliza Node.js pipelines para melhor gerenciamento de backpressure e tratamento de erros,
     * o que é crucial para processar milhões de registros.
     */
    async exportLinksToCSVFile(): Promise<
        Either<ExportLinksError, { reportUrl: string }>
    > {
        try {
            const csvStream = await this.repository.streamAllLinks();
            const passThrough = new PassThrough();
            const pipelineAsync = promisify(pipeline);
            const pipelinePromise = pipelineAsync(csvStream, passThrough);

            const { url } = await uploadFileToStorage({
                folder: 'downloads',
                fileName: `links-${Date.now()}.csv`,
                contentType: 'text/csv',
                contentStream: passThrough,
            });

            // Wait for the pipeline to complete
            await pipelinePromise;

            return makeRight({ reportUrl: url });
        } catch (err) {
            console.error('Failed to export links:', err);
            return makeLeft({ message: 'Failed to export links' });
        }
    }
}
