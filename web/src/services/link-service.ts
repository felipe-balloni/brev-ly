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
}
