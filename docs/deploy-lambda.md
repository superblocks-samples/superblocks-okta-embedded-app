# Deploying Lambda Auth Function

## Prerequisites

Before deploying your Lambda function, ensure that you have the following:

- An AWS account with appropriate permissions
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- AWS CLI installed and configured with `aws configure`
- Docker Desktop (required for `sam local` and `sam build`)

## Local Development

1. **Install dependencies**

   From the project root:

   ```bash
   npm install
   ```

2. **Configure local environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp lambda/env.local.json.example lambda/env.local.json
   ```

   Edit `lambda/env.local.json` with your actual Okta and Superblocks configuration.

3. **Build and start the local API**

   ```bash
   npm run dev:lambda
   ```

   This runs `sam build` followed by `sam local start-api` on port 3001. The endpoint will be available at `http://127.0.0.1:3001/auth`.

   You can also run the build and API steps separately:

   ```bash
   npm run sam:build          # Build the SAM application
   npm run dev:lambda         # Start local API (builds first)
   ```

4. **Test with a direct invocation**

   Edit `lambda/events/token-exchange.json` with real Okta tokens, then:

   ```bash
   npm run sam:invoke
   ```

5. **Test with curl**

   ```bash
   curl -X GET "http://127.0.0.1:3001/auth" \
     -H "Authorization: Bearer $OKTA_ACCESS_TOKEN" \
     -H "X-ID-Token: $OKTA_ID_TOKEN"
   ```

## Deploying with SAM

1. **Build the application**

   ```bash
   cd lambda
   sam build
   ```

2. **Deploy (guided, first time)**

   ```bash
   sam deploy --guided
   ```

   SAM will prompt you for parameter values (`OktaIssuer`, `OktaAudience`, `SuperblocksUrl`) and save your choices to `samconfig.toml` for future deploys.

   > **Important:** After deploying, update the `SUPERBLOCKS_EMBED_ACCESS_TOKEN` environment variable in the Lambda console (SAM parameters are not suitable for secrets).

3. **Deploy (subsequent)**

   ```bash
   sam deploy
   ```

## Manual Deployment (without SAM)

If you prefer to deploy without SAM, you can package and deploy the Lambda function manually.

1. **Package the Lambda Function**

   ```bash
   npm run build:lambda
   ```

2. **Deploy the Lambda Function**

   Replace `<YOUR_FUNCTION_NAME>` and `<YOUR_ROLE_ARN>` with your values:

   ```bash
   aws lambda create-function \
       --function-name <YOUR_FUNCTION_NAME> \
       --zip-file fileb://lambda/function.zip \
       --handler index.handler \
       --runtime nodejs20.x \
       --role <YOUR_ROLE_ARN>
   ```

3. **Set Up Environment Variables**

   ```bash
   aws lambda update-function-configuration \
       --function-name <YOUR_FUNCTION_NAME> \
       --environment "Variables={SUPERBLOCKS_URL='https://app.superblocks.com',SUPERBLOCKS_EMBED_ACCESS_TOKEN='your_superblocks_token',OKTA_ISSUER='your_okta_issuer'}"
   ```

   Environment variables:
   - `SUPERBLOCKS_URL`: Base URL of your Superblocks instance (defaults to `https://app.superblocks.com`)
   - `SUPERBLOCKS_EMBED_ACCESS_TOKEN`: [Embed access token](https://docs.superblocks.com/administration/security/access-tokens#api-authentication) for the session API
   - `OKTA_ISSUER`: Okta issuer URL from your [Okta OIDC app](./setup-okta-app.md) (e.g., `https://dev-12345.okta.com/oauth2/default`)

## Setting Up API Gateway (Manual Only)

If deploying manually (not via SAM), you need to create an API Gateway:

1. Go to the [API Gateway console](https://console.aws.amazon.com/apigateway)
2. Click **Create API** > **HTTP API** > **Build**
3. Set route to `GET /auth` with a **Lambda** integration pointing to your function
4. Enable CORS with allowed origins, methods (`GET`), and headers (`Authorization`, `X-ID-Token`, `Content-Type`)
5. Deploy the API and note the **Invoke URL**
