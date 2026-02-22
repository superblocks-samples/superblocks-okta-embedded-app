const axios = require("axios");
const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const SUPERBLOCKS_URL = process.env.SUPERBLOCKS_URL;
const OKTA_AUDIENCE = process.env.OKTA_AUDIENCE || 'api://default';
const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

let cachedEmbedToken = null;

async function getEmbedAccessToken() {
    if (cachedEmbedToken) return cachedEmbedToken;

    // Local dev: use env var directly from env.local.json
    if (process.env.SUPERBLOCKS_EMBED_ACCESS_TOKEN) {
        cachedEmbedToken = process.env.SUPERBLOCKS_EMBED_ACCESS_TOKEN;
        return cachedEmbedToken;
    }

    // Production: fetch from Secrets Manager (SDK available in Lambda runtime)
    const secretArn = process.env.SUPERBLOCKS_TOKEN_SECRET_ARN;
    if (!secretArn) {
        throw new Error('No SUPERBLOCKS_EMBED_ACCESS_TOKEN or SUPERBLOCKS_TOKEN_SECRET_ARN configured');
    }

    const client = new SecretsManagerClient();
    const resp = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
    cachedEmbedToken = resp.SecretString;
    return cachedEmbedToken;
}

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.OKTA_ISSUER,
});

exports.handler = async (event) => {
    const requestId = event.requestContext?.requestId || 'local-dev';
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [${requestId}] Token exchange started`);

    const authHeader = event.headers['authorization'] || event.headers['Authorization'];

    if (!authHeader) {
        console.error(`[${timestamp}] [${requestId}] ERROR: Missing Authorization header`);
        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Unauthenticated',
                message: 'Authorization header is required'
            })
        };
    }

    let body;
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON body' })
        };
    }

    const idToken = body.id_token;
    if (!idToken) {
        console.error(`[${timestamp}] [${requestId}] ERROR: Missing id_token in request body`);
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Bad Request',
                message: 'id_token is required in the request body'
            })
        };
    }

    const token = authHeader.split(' ')[1];

    try {
        // Step 1: Validate Okta Access Token
        console.log(`[${timestamp}] [${requestId}] Validating Okta access token (issuer: ${process.env.OKTA_ISSUER}, aud: ${OKTA_AUDIENCE})`);
        const oktaJwt = await oktaJwtVerifier.verifyAccessToken(token, OKTA_AUDIENCE);

        if (DEBUG) {
            console.log(`[${timestamp}] [${requestId}] DEBUG: Okta token validated - sub: ${oktaJwt.claims.sub}, email: ${oktaJwt.claims.email || 'N/A'}`);
        } else {
            console.log(`[${timestamp}] [${requestId}] Okta token validated successfully`);
        }

        // Step 2: Decode ID Token
        const decodedIdToken = jwt.decode(idToken, { complete: true });
        if (!decodedIdToken) {
            throw new Error('Failed to decode ID token');
        }

        const idClaims = decodedIdToken.payload;

        if (DEBUG) {
            console.log(`[${timestamp}] [${requestId}] DEBUG: ID token decoded - name: ${idClaims.name || 'N/A'}`);
        } else {
            console.log(`[${timestamp}] [${requestId}] ID token decoded successfully`);
        }

        // Step 3: Create Superblocks user object
        const user = {
            email: oktaJwt.claims.email || oktaJwt.claims.sub,
            name: idClaims.name || idClaims.preferred_username,
        }

        // Step 4: Exchange for Superblocks token
        console.log(`[${timestamp}] [${requestId}] Exchanging token with Superblocks`);

        const embedAccessToken = await getEmbedAccessToken();

        if (DEBUG) {
            console.log(`[${timestamp}] [${requestId}] DEBUG: Superblocks URL: ${SUPERBLOCKS_URL}`);
            console.log(`[${timestamp}] [${requestId}] DEBUG: Request payload:`, JSON.stringify(user, null, 2));
        }

        const superblocksTokenUrl = `${SUPERBLOCKS_URL}/api/v1/public/token`;
        const response = await axios.post(
            superblocksTokenUrl,
            user,
            {
                headers: {
                    'Authorization': `Bearer ${embedAccessToken}`,
                    'Content-Type': 'application/json'
                },
            }
        );

        console.log(`[${timestamp}] [${requestId}] SUCCESS: Token exchange completed (status: ${response.status})`);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        console.error(`[${timestamp}] [${requestId}] ERROR: Token exchange failed`);

        if (error.response) {
            // Axios error with response
            console.error(`[${timestamp}] [${requestId}] HTTP Error - Status: ${error.response.status}, Message: ${error.response.statusText}`);

            if (DEBUG) {
                console.error(`[${timestamp}] [${requestId}] DEBUG: Response data:`, JSON.stringify(error.response.data, null, 2));
            }
        } else if (error.message) {
            // General error with message
            console.error(`[${timestamp}] [${requestId}] ${error.name || 'Error'}: ${error.message}`);

            if (DEBUG && error.stack) {
                console.error(`[${timestamp}] [${requestId}] DEBUG: Stack trace:`, error.stack);
            }
        } else {
            // Unknown error
            if (DEBUG) {
                console.error(`[${timestamp}] [${requestId}] DEBUG: Unknown error:`, error);
            } else {
                console.error(`[${timestamp}] [${requestId}] Unknown error occurred`);
            }
        }

        return {
            statusCode: 403,
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                error: 'Access denied',
                message: error.message || 'Token validation failed'
            })
        }
    }
}
