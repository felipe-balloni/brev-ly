import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

export type NewLinkPayload = {
    originalUrl: string;
    shortenedUrl: string;
};

export class LinkService {
    static async createLink(payload: NewLinkPayload) {
        return api.post('/links', payload);
    }

    static async getLinks(limit = 20, cursor?: string) {
        let url = `/links?limit=${limit}`;
        if (cursor) url += `&cursor=${cursor}`;
        return api.get(url);
    }

    static async deleteLink(shortenedUrl: string) {
        return api.delete(`/links/${shortenedUrl}`);
    }

    static async exportCsv() {
        return api.get('/links/export');
    }

    static async accessOriginalLink(shortenedUrl: string) {
        return api.patch(`/links/${shortenedUrl}/access`);
    }
}
