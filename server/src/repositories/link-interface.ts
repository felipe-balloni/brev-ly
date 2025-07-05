import type { Readable } from 'stream';
import type { CreateLinkDTO, LinkResponseDTO, UpdateLinkDTO } from '@/dtos/link.js';

export interface GetAllLinksResult {
    links: LinkResponseDTO[];
    nextCursor?: string;
}

export interface LinkRepositoryInterface {
    findByShortenedUrl(shortenedUrl: string): Promise<LinkResponseDTO | null>;
    findById(id: string): Promise<LinkResponseDTO | null>;
    create(data: CreateLinkDTO): Promise<LinkResponseDTO>;
    update(id: string, data: UpdateLinkDTO): Promise<LinkResponseDTO>;
    delete(id: string): Promise<void>;
    incrementAccessCount(shortenedUrl: string): Promise<void>;
    getAccessCount(shortenedUrl: string): Promise<number>;
    getAllLinks(limit?: number, cursor?: string): Promise<GetAllLinksResult>;
    streamAllLinks(): Promise<Readable>;
}
