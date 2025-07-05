import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string(),
    CLOUDFLARE_R2_ACCOUNT_ID: z.string().default(''),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().default(''),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().default(''),
    CLOUDFLARE_R2_BUCKET: z.string().default(''),
    CLOUDFLARE_R2_PUBLIC_URL: z
        .string()
        .default('https://r2.cloudflarestorage.com/'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.log('❌ Invalid environment variables', _env.error.format());

    throw new Error('Invalid environment variables');
}

export const env = _env.data;
