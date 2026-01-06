// eslint-disable-next-line
export default {
    oidc: {
        clientId: '<OKTA_APP_CLIENT_ID>',
        issuer: 'https://<OKTA_DOMAIN>.okta.com/oauth2/default',
        redirectUri: window.location.origin + '/login/callback',
        scopes: ['openid', 'profile', 'email'],
    },
    superblocks: {
        appId: '<SUPERBLOCKS_APP_ID?>',
    },
    resourceServer: {
        tokenUrl: '<API_GATEWAY_URL>'
    }
};