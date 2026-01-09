const axios = require("axios");
const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');

require('dotenv').config();

const SUPERBLOCKS_EMBED_ACCESS_TOKEN = process.env.SUPERBLOCKS_EMBED_ACCESS_TOKEN;
const SUPERBLOCKS_URL = process.env.SUPERBLOCKS_URL;
const OKTA_AUDIENCE = process.env.OKTA_AUDIENCE || 'api://default';
const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.OKTA_ISSUER,
});

exports.handler = async (event) => {
    const requestId = event.requestContext?.requestId || 'local-dev';
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [${requestId}] Token exchange started`);

    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    const idToken = event.headers['x-id-token'] || event.headers['X-ID-Token'];

    // Validate request has required headers
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

    if (!idToken) {
        console.error(`[${timestamp}] [${requestId}] ERROR: Missing X-ID-Token header`);
        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Unauthenticated',
                message: 'X-ID-Token header is required'
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
                    'Authorization': `Bearer ${SUPERBLOCKS_EMBED_ACCESS_TOKEN}`,
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
