require('dotenv').config();

const EdgeGrid = require('akamai-edgegrid');

class AkamaiCacheClient {
    constructor() {
        const requiredVars = [
            'host',
            'client_token',
            'client_secret',
            'access_token'
        ];

        const missing = requiredVars.filter(v => !process.env[v]);

        if (missing.length) {
            throw new Error(
                `Missing required environment variables: ${missing.join(', ')}`
            );
        }

        this.eg = new EdgeGrid(
            process.env.client_token,
            process.env.client_secret,
            process.env.access_token,
            process.env.host
        );
    }

    purgeUrl(url) {
        return new Promise((resolve, reject) => {
            this.eg.auth({
                path: '/ccu/v3/invalidate/url',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    objects: [url]
                })
            });


            this.eg.send((error, response, body) => {
                if (error) {
                    console.error('Request failed');

                    if (error.response) {
                        console.error('Status:', error.response.status);
                        console.error(
                            JSON.stringify(error.response.data, null, 2)
                        );
                    } else {
                        console.error(error);
                    }

                    return reject(error);
                }

                console.log(
                    JSON.stringify(JSON.parse(body), null, 2)
                );

                resolve(JSON.parse(body));
            });

        });
    }
}

async function main() {
    const url = process.argv[2];

    if (!url) {
        console.error('Usage: node purge.js <url>');
        process.exit(1);
    }

    try {
        const client = new AkamaiCacheClient();

        const result = await client.purgeUrl(url);

        console.log('Purge submitted successfully');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Purge failed:', err.message);
        process.exit(1);
    }
}

main();