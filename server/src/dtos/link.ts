export interface CreateLinkDTO {
    originalUrl: string;
    shortenedUrl: string;
}

export interface UpdateLinkDTO {
    originalUrl?: string;
    shortenedUrl?: string;
}

export interface LinkResponseDTO {
    id: string;
    originalUrl: string;
    shortenedUrl: string;
    accessCount: number;
    createdAt: Date;
}
