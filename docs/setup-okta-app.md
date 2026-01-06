# Create Okta app integration

Before you integrate authentication into the React app, you need to register your app in Okta. This provides you with the OpenID Connect client ID for authentication requests from your app. Register your app by creating an app integration through the [Okta CLI](https://cli.okta.com/), the [Okta Apps API](https://developer.okta.com/docs/api/openapi/okta-management/management/tag/Application/#tag/Application), or the [Admin Console](https://developer.okta.com/docs/concepts/okta-organizations/#admin-console) with the following steps:

1. To create an app integration for your React app, sign in to your [Admin Console](https://login.okta.com/)
1. Select **Applications** > **Applications**, and then click **Create App Integration**
1. In the dialog that appears, select **OIDC - OpenID Connect** as the **Sign-on method**, **Single-Page Application** as the **Application type**, and then click **Next**
1. Fill in the following new app integration settings, and then click **Save**:

    | Setting |	Value/Description |
    |---------|-------------------|
    | App integration name | Specify a unique name for your app |
    | Grant types | Leave Authorization Code selected, and then select Refresh Token |
    | Sign-in redirect URIs	| Specify your app URI for the callback redirect from Okta. For example, http://localhost:3000/login/callback |
    | Sign-out redirect URIs | Specify your app sign-out redirect URI. For example: http://localhost:3000. Ensure that you add all your deployment URIs |
    | Trusted Origins > Base URIs | Specify your app base URI for CORS. For example: http://localhost:3000. Ensure that you add trusted origins for all base URIs. |
    | Assignments| Assign users to your app |
    
## App integration settings

You need two pieces of information from your org and app integration for the React app:

* **Client ID**: From the **General** tab of your app integration, save the generated **Client ID** value
* **Issuer**: From the **General** tab of your app integration, save the **Okta domain** value. Use your Okta domain value for the issuer setting, which represents the authorization server. Use `https://{yourOktaDomain}/oauth2/default` as the issuer for your app. See [Issuer configuration](https://developer.okta.com/docs/guides/oie-embedded-common-download-setup-app/nodejs/main/#issuer) if you want to use another Okta custom authorization server.