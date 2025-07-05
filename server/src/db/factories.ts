import type { CreateLinkDTO } from '@/dtos/link.js';
import type { LinkService } from '@/services/link-service.js';

/**
 * Popula um serviço de links com uma quantidade de links para testes ou seed.
 * @param service Instância de LinkService
 * @param count Quantidade de links a criar
 * @param overrides Função para customizar cada DTO (opcional)
 */
export const populateLinks = async (
    service: LinkService,
    count: number,
    overrides?: (i: number) => Partial<CreateLinkDTO>,
) => {
    for (let i = 0; i < count; i++) {
        await service.createLink({
            originalUrl: `https://example.com/${i}`,
            shortenedUrl: `short${i}`,
            ...(overrides ? overrides(i) : {}),
        });
    }
};
