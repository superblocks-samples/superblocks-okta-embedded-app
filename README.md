# Superblocks Embed + React + Okta Authentication

This example demonstrates how to build a custom authentication flow for embedded Superblocks applications using the Superblocks Embed SDK, Okta for identity management, and AWS Lambda for secure token exchange. The application provides seamless SSO integration with synchronized routing between Superblocks multi-page apps and browser navigation.

## 🏗️ Architecture Overview

This application implements a secure authentication flow that:

1. **Authenticates users** through Okta using OAuth 2.0/OIDC
2. **Exchanges tokens** via AWS Lambda function for secure server-side validation
3. **Embeds Superblocks apps** with authenticated user context
4. **Synchronizes routing** between Superblocks pages and browser URLs

```
┌─────────────┐         ┌─────────────────────────────┐         ┌───────────────────┐
│  React App  │────────▶│  Okta                       │         │ Superblocks       │
│             │         │                             │         │                   │
│  Embed SDK  │◀────────│  OAuth/OIDC Login           │         │  Embedded App     │
└─────────────┘         └─────────────────────────────┘         └───────────────────┘
       │                                                                 ▲
       │                                                                 │
       └───────────────▶┌─────────────────────────────┐                  │
                        │  AWS Lambda + API Gateway   │──────────────────┘
                        │                             │
                        │  Token Validation &         │
                        │  Superblocks Auth Exchange  │
                        └─────────────────────────────┘
```

**Key Features:**

- 🔐 **Secure Authentication**: Okta OIDC integration with token validation
- 🔄 **Token Exchange**: Server-side Lambda function for secure credential exchange
- 🧭 **Synchronized Routing**: Browser URL stays in sync with Superblocks navigation
- ⚡ **Seamless SSO**: No additional login required within embedded apps

## 📋 Prerequisites

Before you begin, ensure you have the following:

- **Node.js**: Version 16 or higher
- **npm**: Version 8 or higher
- **Okta Account**: With admin access to create applications
- **AWS Account**: With permissions to deploy Lambda functions and API Gateway
- **Superblocks Account**: With embed functionality enabled
- **AWS CLI**: Installed and configured (for Lambda deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/superblocks-samples/superblocks-okta-embedded-app.git
cd superblocks-okta-embedded-app

# Install dependencies for both React app and Lambda function
npm install

# Set up environment files (optional but recommended)
cp app/.env.example app/.env
cp lambda/.env.example lambda/.env
```

> **Tip**: Using `.env` files makes it easier to manage different configurations for development, staging, and production environments.

### 2. Create Okta OIDC Application

Follow the detailed guide to [Create an Okta OIDC-based Single Page Application](docs/setup-okta-app.md).

**Quick summary:**

1. Log in to your Okta Admin Console
2. Navigate to **Applications** > **Applications**
3. Click **Create App Integration**
4. Select **OIDC - OpenID Connect** and **Single-Page Application**
5. Configure redirect URIs (e.g., `http://localhost:3000/login/callback`)
6. Note your **Client ID** and **Okta Domain**

### 3. Deploy AWS Lambda Function

Follow the detailed guide to [Deploy Lambda Function](docs/deploy-lambda.md) and configure API Gateway.

**Quick summary:**

1. Build the Lambda deployment package:
   ```bash
   npm run build:lambda
   # Or: cd lambda && npm run build
   # This creates function.zip
   ```
2. Deploy `function.zip` to AWS Lambda with appropriate IAM role
3. Create API Gateway endpoint (REST or HTTP API)
4. Enable CORS for your React app origin
5. Note your **API Gateway URL**

This Lambda function handles [Embedded SSO Authentication](https://docs.superblocks.com/applications/embedded-apps/authentication) by validating Okta tokens and exchanging them for Superblocks session tokens.

### 4. Configure the Application

You can configure the application using either environment variables or by editing the config file directly.

**Option A: Using Environment Variables (Recommended)**

Copy the example file and configure your values:

```bash
cd app
cp .env.example .env
```

Then edit `app/.env` with your actual values. The React app will automatically load these environment variables.

**Option B: Editing Config File Directly**

Update [`app/src/config.js`](app/src/config.js) with your environment-specific values:

```javascript
export const config = {
  OKTA_APP_CLIENT_ID: "your-okta-client-id",
  OKTA_DOMAIN: "your-domain.okta.com",
  OKTA_ISSUER: "https://your-domain.okta.com/oauth2/default",
  SUPERBLOCKS_APP_ID: "your-superblocks-app-id",
  API_GATEWAY_URL: "https://your-api-gateway-url.amazonaws.com/prod/auth",
};
```

**Configuration Reference:**

| Variable             | Description                                          | Example                                                        |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `OKTA_APP_CLIENT_ID` | Client ID from your Okta OIDC application            | `0oa1b2c3d4e5f6g7h8i9`                                         |
| `OKTA_DOMAIN`        | Your Okta organization domain                        | `dev-12345.okta.com`                                           |
| `OKTA_ISSUER`        | The Okta authorization server issuer URL             | `https://dev-12345.okta.com/oauth2/default`                    |
| `SUPERBLOCKS_APP_ID` | The ID of the Superblocks application to embed       | `8ad5de4d-f5ed-4f86-aabe-fd854893846a`                         |
| `API_GATEWAY_URL`    | Your AWS API Gateway endpoint URL for token exchange | `https://abc123.execute-api.us-east-1.amazonaws.com/prod/auth` |

### 5. Run the Application

```bash
# Start the React development server (from root directory)
npm start
```

The app will be available at `http://localhost:3000`.

> **Note**: `npm start` from the root directory automatically runs the app in development mode with environment variables configured.

## 💻 Local Development

### React Application Development

**1. Install dependencies**

```bash
cd app
npm install
```

**2. Configure environment**

Copy and configure the environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your development values, or alternatively update `app/src/config.js` directly (see configuration section above).

**3. Start development server**

From the root directory:

```bash
npm start
# Runs the app in development mode on http://localhost:3000
```

Or from the app directory with more control:

```bash
cd app
npm run dev
# Starts with development environment and git branch detection
```

### Development Features

- 🔄 **Hot Reloading**: Automatic refresh when you make changes
- 🎨 **React DevTools**: Debug component state and props
- 🔍 **Source Maps**: Easy debugging with original source code
- 🧪 **Fast Refresh**: Maintains component state during development
- 🌍 **Environment Support**: Built-in dev, staging, and production configurations
- 📦 **Easy Packaging**: One-command Lambda deployment package creation

### Lambda Function Local Testing

To test the Lambda function locally before deployment:

**1. Create environment file**

Copy the example environment file and configure it with your values:

```bash
cd lambda
cp .env.example .env
```

Then edit `lambda/.env` with your actual values:

```env
# Base URL of your Superblocks instance
# Format: https://<your-instance>.superblocks.com
SUPERBLOCKS_URL=https://app.superblocks.com

# Token used to authenticate with the Superblocks Session API
SUPERBLOCKS_EMBED_ACCESS_TOKEN=your-superblocks-embed-token

# Same Okta issuer found in app/src/config.js
OKTA_ISSUER=https://your-domain.okta.com/oauth2/default

# Test tokens (obtain these by logging in through your app)
OKTA_ACCESS_TOKEN=your-test-access-token
OKTA_ID_TOKEN=your-test-id-token
```

**2. Install Lambda dependencies**

```bash
cd lambda
npm install
```

**3. Run local tests**

From the root directory:

```bash
npm run test:lambda
```

Or from the lambda directory:

```bash
cd lambda
npm test
```

This will invoke the Lambda handler locally with the test tokens from your `.env` file.

**4. Build deployment package (optional)**

To create a `function.zip` file ready for AWS Lambda deployment:

```bash
cd lambda
npm run build
```

This packages all Lambda code and dependencies into `function.zip`.

## 🔧 Configuration

### Directory Structure

```
superblocks-okta-embedded-app/
├── app/
│   ├── src/
│   │   ├── config.js         # Application configuration
│   │   ├── App.js            # Main React component
│   │   └── ...               # Other React components
│   ├── public/
│   ├── .env.example          # Example environment variables
│   ├── .env                  # Local configuration (not committed, optional)
│   └── package.json          # React app dependencies
├── lambda/
│   ├── index.js              # Lambda handler function
│   ├── test.js               # Local test script
│   ├── package.json          # Lambda dependencies
│   ├── .env.example          # Example environment variables
│   └── .env                  # Local test configuration (not committed)
├── docs/
│   ├── setup-okta-app.md     # Okta setup guide
│   └── deploy-lambda.md      # Lambda deployment guide
├── .gitignore                # Git ignore rules
└── package.json              # Root package.json for workspace
```

### Environment Variables

#### React Application Configuration

The React app can be configured using environment variables (`.env` file) or directly in `app/src/config.js`.

**Environment Variables (Recommended):**

Create an `app/.env` file based on `app/.env.example`:

| Variable                            | Required | Description                                 | Example                                     |
| ----------------------------------- | -------- | ------------------------------------------- | ------------------------------------------- |
| `REACT_APP_OKTA_CLIENT_ID`          | ✅ Yes   | Okta OIDC application client ID             | `0oa1b2c3d4e5f6g7h8i9`                      |
| `REACT_APP_OKTA_DOMAIN`             | ✅ Yes   | Your Okta organization domain               | `dev-12345.okta.com`                        |
| `REACT_APP_OKTA_ISSUER`             | ✅ Yes   | Okta authorization server issuer URL        | `https://dev-12345.okta.com/oauth2/default` |
| `REACT_APP_SUPERBLOCKS_SERVER_HOST` | ✅ Yes   | Superblocks instance URL                    | `https://app.superblocks.com`               |
| `REACT_APP_SUPERBLOCKS_APP_ID`      | ✅ Yes   | Superblocks application ID to embed         | `8ad5de4d-f5ed-4f86-aabe-fd854893846a`      |
| `REACT_APP_API_GATEWAY_URL`         | ✅ Yes   | AWS API Gateway endpoint for token exchange | `https://api.example.com/auth`              |
| `REACT_APP_ENV`                     | ❌ No    | Environment name (dev/staging/production)   | `development`                               |

**Config File (`app/src/config.js`):**

Alternatively, you can configure values directly in the config file. See the Configuration section above for the structure.

#### Lambda Function Environment Variables

Configure these in your AWS Lambda function settings. For local testing, use the `lambda/.env` file (create from `lambda/.env.example`):

| Variable                         | Required | Description                                           | Example                                                                            |
| -------------------------------- | -------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `SUPERBLOCKS_URL`                | ❌ No    | Base URL of your Superblocks instance                 | `https://<your-instance>.superblocks.com` (default: `https://app.superblocks.com`) |
| `SUPERBLOCKS_EMBED_ACCESS_TOKEN` | ✅ Yes   | Superblocks embed access token for API authentication | `sb_embed_...`                                                                     |
| `OKTA_ISSUER`                    | ✅ Yes   | Okta issuer URL (must match React app configuration)  | `https://dev-12345.okta.com/oauth2/default`                                        |
| `OKTA_ACCESS_TOKEN`              | ⚠️ Test  | Test access token (local testing only)                | `eyJhbG...`                                                                        |
| `OKTA_ID_TOKEN`                  | ⚠️ Test  | Test ID token (local testing only)                    | `eyJhbG...`                                                                        |

> **Note**:
>
> - `SUPERBLOCKS_URL` defaults to `https://app.superblocks.com`. Format is `https://<your-instance>.superblocks.com`. Set this if using Superblocks EU or Superblocks Cloud Prem. 
> - `OKTA_ACCESS_TOKEN` and `OKTA_ID_TOKEN` are only needed for local testing with `npm run test:lambda`. They are not used in production.

**Security Best Practices:**

- Store `SUPERBLOCKS_EMBED_ACCESS_TOKEN` in AWS Secrets Manager or Parameter Store
- Use environment variables in Lambda, not hardcoded values
- Enable CloudWatch Logs for Lambda monitoring
- Configure appropriate IAM roles with least privilege
- Never commit `.env` files to version control

### Available Scripts

#### Root Directory

| Script                 | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `npm install`          | Install dependencies for both React app and Lambda function      |
| `npm start`            | Start the React app in development mode (runs `app/npm run dev`) |
| `npm run test:lambda`  | Test Lambda function locally (runs `lambda/npm test`)            |
| `npm run build:app`    | Build the React app for production                               |
| `npm run build:lambda` | Package Lambda function into `function.zip` for deployment       |
| `npm run build:all`    | Build both React app and Lambda function                         |

#### React App (`./app`)

| Script                     | Description                                                           |
| -------------------------- | --------------------------------------------------------------------- |
| `npm run dev`              | Start development server with dev environment and git branch tracking |
| `npm run staging`          | Start development server with staging environment                     |
| `npm run build:staging`    | Create optimized build for staging environment                        |
| `npm run build:production` | Create optimized build for production environment                     |
| `npm run eject`            | Eject from Create React App (⚠️ one-way operation)                    |

> **Note**: The app package.json does not have a generic `build` or `start` script. Use `dev` for local development and the environment-specific build scripts for deployments.

#### Lambda Function (`./lambda`)

| Script          | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `npm test`      | Test Lambda handler locally with `.env` configuration         |
| `npm start`     | Run Lambda handler directly (for local testing)               |
| `npm run build` | Create `function.zip` package ready for AWS Lambda deployment |

## 🔐 Security Features

### OAuth 2.0 / OIDC Authentication

- **Industry Standard**: Uses OAuth 2.0 and OpenID Connect protocols
- **Okta Integration**: Secure authentication through Okta Identity Platform
- **Token Validation**: ID tokens validated against Okta's public keys
- **Short-lived Tokens**: Access tokens have configurable expiration

### Secure Token Exchange

- **Server-Side Validation**: Lambda function validates Okta tokens server-side
- **No Client Secrets**: React app never handles sensitive credentials
- **HTTPS Only**: All token exchanges occur over encrypted connections
- **Token Verification**: Lambda validates token signatures and claims before exchange

### AWS Lambda Security

- **IAM Roles**: Lambda execution with least-privilege IAM policies
- **Secrets Management**: Sensitive tokens stored in AWS Secrets Manager
- **VPC Configuration**: Optional VPC deployment for enhanced network security
- **API Gateway**: Rate limiting and request throttling protection

### Superblocks Integration

- **Embedded SSO**: Seamless authentication without additional login prompts
- **User Context**: User identity and claims passed to Superblocks
- **Session Management**: Secure session cookies with HTTP-only flag
- **Token Refresh**: Automatic token refresh handling

## 🧭 Routing Synchronization

This application maintains synchronization between Superblocks multi-page routing and browser URLs:

### How It Works

1. **Superblocks Page Changes**: When users navigate within the Superblocks app, the browser URL updates automatically
2. **Browser Navigation**: Back/forward buttons work as expected with Superblocks pages
3. **Direct URL Access**: Users can bookmark and share specific pages within the embedded app
4. **Deep Linking**: Support for direct navigation to specific pages on initial load

### Benefits

- ✅ **Better UX**: Browser controls work naturally with embedded app
- ✅ **Shareable URLs**: Users can share links to specific pages
- ✅ **Browser History**: Full history support for navigation
- ✅ **Bookmarking**: Users can bookmark specific app pages

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to fetch Superblocks token" Error

**Cause**: Lambda function cannot validate tokens or exchange them with Superblocks.

**Solution:**

- Verify `API_GATEWAY_URL` in `config.js` is correct
- Check Lambda CloudWatch logs for detailed error messages
- Ensure `SUPERBLOCKS_EMBED_ACCESS_TOKEN` environment variable is set in Lambda
- Verify CORS is configured correctly on API Gateway

#### 2. Okta Login Redirects to Error Page

**Cause**: Misconfigured Okta application or incorrect redirect URIs.

**Solution:**

- Verify redirect URIs in Okta app settings match your app URL
- Check `OKTA_APP_CLIENT_ID` and `OKTA_DOMAIN` in `config.js`
- Ensure your Okta app is assigned to test users
- Check browser console for specific Okta error messages

#### 3. "Invalid issuer" Error in Lambda

**Cause**: Mismatch between React app and Lambda Okta issuer configuration.

**Solution:**

- Ensure `OKTA_ISSUER` is identical in both `app/src/config.js` and Lambda environment variables
- Verify issuer URL format: `https://your-domain.okta.com/oauth2/default`
- Check for trailing slashes or typos

#### 4. CORS Errors in Browser Console

**Cause**: API Gateway CORS not configured properly.

**Solution:**

- Enable CORS in API Gateway for your endpoint
- Add your React app origin (e.g., `http://localhost:3000`) to allowed origins
- Include required headers: `Authorization`, `Content-Type`
- Allow credentials if using cookies

#### 5. Embedded App Not Loading

**Cause**: Incorrect Superblocks application ID or network issues.

**Solution:**

- Verify `SUPERBLOCKS_APP_ID` in `config.js` is correct
- Check browser Network tab for failed requests
- Ensure Superblocks app has embedding enabled
- Check browser console for Superblocks SDK errors

#### 6. Routing Not Synchronized

**Cause**: Incorrect routing configuration in React app.

**Solution:**

- Verify Superblocks Embed SDK is properly initialized
- Check that routing event handlers are registered
- Review browser console for routing-related warnings
- Ensure React Router configuration matches Superblocks pages

### Debugging Tips

**Enable Verbose Logging:**

In your React app, enable debug mode:

```javascript
// In App.js or config.js
window.localStorage.setItem("debug", "superblocks:*");
```

**Check Lambda Logs:**

```bash
# View recent Lambda logs
aws logs tail /aws/lambda/your-function-name --follow
```

**Test Lambda Independently:**

```bash
# Use AWS CLI to invoke Lambda with test payload
aws lambda invoke \
  --function-name your-function-name \
  --payload '{"accessToken":"test","idToken":"test"}' \
  response.json
```

**Network Debugging:**

- Open browser DevTools > Network tab
- Filter by "Fetch/XHR" to see API calls
- Check request/response headers and payloads
- Verify response status codes

## 🔄 Deployment

### Production Build

**1. Build the React application**

From the root directory:

```bash
npm run build:app
```

Or from the app directory with environment control:

```bash
cd app
npm run build:production
# Or for staging:
npm run build:staging
```

This creates an optimized production build in the `app/build` directory.

**2. Build Lambda function**

```bash
npm run build:lambda
```

This creates `lambda/function.zip` ready for deployment.

Alternatively, build everything at once:

```bash
npm run build:all
```

**3. Deploy to hosting provider**

Common options for the React app:

- **AWS S3 + CloudFront**: Static site hosting with CDN
- **Netlify**: Automatic deployments from Git
- **Vercel**: Zero-configuration deployments
- **AWS Amplify**: Full-stack hosting with CI/CD

Deploy the `app/build` directory to your chosen hosting provider.

**4. Deploy Lambda function**

Upload `lambda/function.zip` to AWS Lambda or use AWS CLI/SAM for deployment.

**5. Update Lambda configuration**

- Update `OKTA_ISSUER` environment variable if needed
- Ensure `SUPERBLOCKS_EMBED_ACCESS_TOKEN` is properly configured
- Configure appropriate Lambda timeout and memory
- Set up CloudWatch alarms for monitoring

**6. Configure API Gateway**

- Update CORS settings with production domain
- Enable API Gateway caching for better performance
- Set up usage plans and API keys if needed
- Configure custom domain name

### Environment-Specific Configuration

This application supports multiple environments with built-in scripts and environment files.

**Using Environment Files (Recommended):**

Create separate `.env` files for each environment:

```bash
# Development
app/.env.development
app/.env.local

# Staging
app/.env.staging

# Production
app/.env.production
```

React will automatically load the appropriate `.env` file based on the environment. See [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/) for more details.

**Environment Scripts:**

```bash
# Development
cd app
npm run dev
# Uses REACT_APP_ENV=development and detects git branch

# Staging
cd app
npm run staging          # For local testing
npm run build:staging    # For deployment
# Uses REACT_APP_ENV=staging

# Production
cd app
npm run build:production
# Uses REACT_APP_ENV=production
```

**Best Practices for Multiple Environments:**

- Use different Okta applications per environment
- Separate Lambda functions per environment
- Environment-specific `.env` files for React app configuration
- Different Superblocks applications for testing vs production
- Separate API Gateway stages (dev, staging, prod)
- Store production secrets in AWS Secrets Manager

## 📚 Additional Resources

### Documentation

- [Superblocks Embedded Apps](https://docs.superblocks.com/applications/embedded-apps/)
- [Superblocks Embed SDK](https://docs.superblocks.com/applications/embedded-apps/embed-sdk)
- [Superblocks SSO Authentication](https://docs.superblocks.com/applications/embedded-apps/authentication)
- [Okta OIDC Documentation](https://developer.okta.com/docs/guides/sign-into-spa/react/main/)
- [Okta React SDK](https://github.com/okta/okta-react)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

### Guides

- [Setup Okta OIDC Application](docs/setup-okta-app.md) - Step-by-step Okta configuration
- [Deploy Lambda Function](docs/deploy-lambda.md) - Lambda deployment and API Gateway setup

### Related Examples

- [Auth0 React Embed Example](https://github.com/superblocks-samples/auth0-react-embed)
- [Databricks Superblocks App](https://github.com/superblocks-samples/databricks-superblocks-app)

## 📊 Architecture Deep Dive

### Authentication Flow

```
1. User accesses React app
   ↓
2. Okta login screen (if not authenticated)
   ↓
3. User authenticates with Okta
   ↓
4. Okta redirects to app with tokens
   ↓
5. React app sends tokens to Lambda via API Gateway
   ↓
6. Lambda validates Okta tokens
   ↓
7. Lambda exchanges tokens with Superblocks
   ↓
8. Lambda returns Superblocks session token
   ↓
9. React app embeds Superblocks app with session token
   ↓
10. User sees embedded Superblocks application
```

### Component Responsibilities

**React App:**

- User interface and routing
- Okta authentication flow
- Token management
- Superblocks SDK integration
- Route synchronization

**AWS Lambda:**

- Token validation (verify Okta tokens)
- Token exchange (get Superblocks session)
- Security boundary (no secrets in frontend)
- Error handling and logging

**API Gateway:**

- HTTP endpoint for Lambda
- Request/response transformation
- CORS handling
- Rate limiting and throttling

**Okta:**

- User authentication
- Token issuance
- User profile management
- MFA and security policies

**Superblocks:**

- Embedded application rendering
- Session management
- API integrations
- Data access and processing

## 📝 License

This is a sample/demo application provided for reference. Please check with your organization regarding licensing and usage.

## 🤝 Support

For issues related to:

- **This example application**: Open an issue in the repository
- **Superblocks Embed**: Contact [Superblocks support](https://www.superblocks.com/support)
- **Okta Integration**: Contact [Okta support](https://support.okta.com/)
- **AWS Services**: Check [AWS documentation](https://docs.aws.amazon.com/) or contact AWS support

## 🙋 FAQ

**Q: Can I use a different identity provider instead of Okta?**
A: Yes! The pattern is similar - you'll need to update the React app to use your IdP's SDK and modify the Lambda function to validate tokens from your provider.

**Q: Do I need to use AWS Lambda, or can I use a different backend?**
A: You can use any backend service (Node.js/Express, Python/Flask, etc.) as long as it can validate tokens and exchange them with Superblocks.

**Q: How do I handle token refresh?**
A: The Okta React SDK handles access token refresh automatically. The Superblocks session token is managed by the Embed SDK.

**Q: Can I embed multiple Superblocks apps?**
A: Yes! You can embed multiple apps by changing the `SUPERBLOCKS_APP_ID` or implementing routing to switch between different embedded apps.

**Q: Is this production-ready?**
A: This is a reference implementation. For production use, consider adding additional error handling, monitoring, logging, and security hardening based on your requirements.
