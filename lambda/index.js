const axios = require("axios");
const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');

require('dotenv').config();

const SUPERBLOCKS_EMBED_ACCESS_TOKEN = process.env.SUPERBLOCKS_EMBED_ACCESS_TOKEN;
const SUPERBLOCKS_URL = process.env.SUPERBLOCKS_URL || 'https://app.superblocks.com';

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.OKTA_ISSUER,
});

exports.handler = async (event) => {
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    const idToken = event.headers['x-id-token'] || event.headers['X-ID-Token'];

    if (!authHeader) {
        console.log('No auth header');
        return {
            statusCode: 401,
            body: JSON.stringify({
                error: 'Unauthenticated'
            })
        };
    }

    const token = authHeader.split(' ')[1];

    try {
        // Validate the Okta token
        console.log('Validating token & decode ID Token');
        const oktaJwt = await oktaJwtVerifier.verifyAccessToken(token, 'api://default');
        const decodedIdToken = jwt.decode(idToken, { complete: true });
        const idClaims = decodedIdToken.payload;

        // Create user object from Okta token info
        console.log('Creating user object');
        const user = {
            email: oktaJwt.claims.email || oktaJwt.claims.sub,
            name: idClaims.name || idClaims.preferred_username,

            // Use Superblocks platform user credentials
            // Comment this out if user should be treated as external to organization
            isSuperblocks: true,

            // Uncomment groupIds and add groups to associated the user with
            // Groups listed should have **End-user** access to applications being embedded
            // groupIds: []
        }

        console.log('Sending token to Superblocks');
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

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        console.error('Token validation failed', error);
        return {
            statusCode: 403,
            body: {
                error: 'Access denied'
            }
        }
    }
}
