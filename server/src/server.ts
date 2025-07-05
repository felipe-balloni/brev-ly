import { app } from '@/app.js';
import { env } from '@/env/index.js';

app.listen({ port: env.PORT, host: env.HOST })
    .then(address => {
        console.log(`🚀 Server listening on ${address}`);
    })
    .catch(err => {
        app.log.error(err);
        process.exit(1);
    });
