import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';
import { Readable } from 'node:stream';
import { Upload } from '@aws-sdk/lib-storage';
import { z } from 'zod';
import { env } from '@/env/index.js';
import { r2 } from './r2-client-service.js';

const uploadFileToStorageInput = z.object({
    folder: z.enum(['images', 'downloads']),
    fileName: z.string(),
    contentType: z.string(),
    contentStream: z.instanceof(Readable),
});

type uploadFileToStorageInput = z.input<typeof uploadFileToStorageInput>;

export async function uploadFileToStorage(input: uploadFileToStorageInput) {
    const { folder, fileName, contentType, contentStream } =
        uploadFileToStorageInput.parse(input);

    const fileExtension = extname(fileName);
    const fileNameWithoutExtension = basename(fileName, fileExtension);
    const sanitizedFileName = fileNameWithoutExtension.replace(
        /[^a-zA-Z0-9]/g,
        '',
    );

    const sanitizedFileNameWithExtension =
        sanitizedFileName.concat(fileExtension);

    console.log(
        fileExtension,
        fileNameWithoutExtension,
        sanitizedFileName,
        sanitizedFileNameWithExtension,
    );

    const uniqueFilename = `${folder}/${randomUUID()}-${sanitizedFileNameWithExtension}`;

    const upload = new Upload({
        client: r2,
        params: {
            Key: uniqueFilename,
            Bucket: env.CLOUDFLARE_R2_BUCKET,
            Body: contentStream,
            ContentType: contentType,
        },
    });

    await upload.done();

    return {
        key: uniqueFilename,
        url: new URL(uniqueFilename, env.CLOUDFLARE_R2_PUBLIC_URL).toString(),
    };
}
