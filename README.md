# Superblocks Embed + React + Okta Authentication

This example demonstrates how to build a custom authentication flow for embedded Superblocks applications using the Superblocks Embed SDK, Okta for identity management, and AWS Lambda for secure token exchange. The application provides seamless SSO integration with synchronized routing between Superblocks multi-page apps and browser navigation.

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌───────────────┐
│  React App  │────────▶│       Okta       │         │  Superblocks  │
│             │◀────────│       OAuth      │         │               │
└─────────────┘         └──────────────────┘         └───────────────┘
      │                                                      ▲
      └────────────────▶┌──────────────────┐─────────────────┘
                        │  Lambda Function │
                        │  Token Exchange  │
                        └──────────────────┘
```

**Flow:**

1. User authenticates with Okta
2. React app sends Okta tokens to Lambda
3. Lambda validates tokens and exchanges with Superblocks
4. React embeds Superblocks app with session token

## Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Okta Account** with admin access
- **Superblocks Account** with embed enabled
- **AWS Account** (for production deployment only)

## 🚀 Quick Start – Local Development

### 1. Clone and Install

```bash
git clone https://github.com/superblocks-samples/superblocks-okta-embedded-app.git
cd superblocks-okta-embedded-app
npm install
```

### 2. Setup Okta

Create an Okta OIDC Single-Page Application ([detailed guide](docs/setup-okta-app.md)):

1. Go to Okta Admin Console > **Applications** > **Create App Integration**
2. Select **OIDC** and **Single-Page Application**
3. Add redirect URI: `http://localhost:3000/login/callback`
4. Save your **Client ID** and **Issuer URL**

### 3. Configure Environment

**Lambda** (`lambda/.env`):

```bash
cp lambda/env.example lambda/.env
```

Edit with your values:

```env
SUPERBLOCKS_EMBED_ACCESS_TOKEN=sb_embed_your-token
OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
SUPERBLOCKS_URL=https://your-instance.superblocks.com
```

**React App** (`app/.env.local`):

```bash
cp app/env.example app/.env.local
```

Edit with your values:

```env
REACT_APP_OKTA_CLIENT_ID=your-okta-client-id
REACT_APP_OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
REACT_APP_SUPERBLOCKS_APPLICATION_ID=your-app-id
REACT_APP_SUPERBLOCKS_URL=https://your-instance.superblocks.com
REACT_APP_USE_LOCAL_LAMBDA=true
```

> ⚠️ `OKTA_ISSUER` must match in both files

### 4. Start Development

```bash
npm start
```

Opens http://localhost:3000 (React) and http://localhost:3001 (Lambda). Both have hot reloading enabled.

## 🚢 Production Deployment

### 1. Deploy Lambda Function

Build and deploy ([detailed guide](docs/deploy-lambda.md)):

```bash
npm run build:lambda
# Creates lambda/function.zip
```

1. Upload `function.zip` to AWS Lambda
2. Set environment variables in Lambda console:
   - `SUPERBLOCKS_EMBED_ACCESS_TOKEN`
   - `OKTA_ISSUER`
   - `SUPERBLOCKS_URL`
   - `OKTA_AUDIENCE` (optional, defaults to `api://default`)
3. Create API Gateway endpoint
4. Enable CORS for your domain
5. Save the API Gateway URL

### 2. Deploy React App

Build the app:

```bash
cd app
npm run build
```

Deploy `app/build/` to your hosting provider (AWS S3, Netlify, Vercel, etc.).

Configure production environment variables:

```env
REACT_APP_OKTA_CLIENT_ID=your-okta-client-id
REACT_APP_OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
REACT_APP_SUPERBLOCKS_APPLICATION_ID=your-app-id
REACT_APP_SUPERBLOCKS_URL=https://your-instance.superblocks.com
REACT_APP_USE_LOCAL_LAMBDA=false
REACT_APP_API_GATEWAY_URL=https://your-api-gateway-url.com/prod/auth
```

### 3. Update Okta Configuration

Add your production URL to Okta redirect URIs:

- Sign-in redirect URI: `https://yourdomain.com/login/callback`
- Sign-out redirect URI: `https://yourdomain.com`

## 🔧 Configuration

### Environment Variables

**React App** (`app/.env.local`):

| Variable                               | Required | Description                                      | Default |
| -------------------------------------- | -------- | ------------------------------------------------ | ------- |
| `REACT_APP_OKTA_CLIENT_ID`             | ✅       | Okta client ID                                   | -       |
| `REACT_APP_OKTA_ISSUER`                | ✅       | Okta issuer URL                                  | -       |
| `REACT_APP_SUPERBLOCKS_APPLICATION_ID` | ✅       | Superblocks app ID                               | -       |
| `REACT_APP_SUPERBLOCKS_URL`            | ✅       | Superblocks instance URL                         | -       |
| `REACT_APP_SUPERBLOCKS_APP_VERSION`    | ❌       | App version: `1.0` (legacy) or `2.0` (code mode) | `2.0`   |
| `REACT_APP_USE_LOCAL_LAMBDA`           | ❌       | Use local Lambda server                          | `false` |
| `REACT_APP_API_GATEWAY_URL`            | ✅\*     | API Gateway URL (\*required if not local)        | -       |

**Lambda** (`lambda/.env`):

| Variable                         | Required | Description                             | Default         |
| -------------------------------- | -------- | --------------------------------------- | --------------- |
| `SUPERBLOCKS_EMBED_ACCESS_TOKEN` | ✅       | Superblocks embed token                 | -               |
| `OKTA_ISSUER`                    | ✅       | Okta issuer URL (must match React app)  | -               |
| `SUPERBLOCKS_URL`                | ✅       | Superblocks instance URL                | -               |
| `OKTA_AUDIENCE`                  | ❌       | Expected JWT audience claim             | `api://default` |
| `DEBUG`                          | ❌       | Enable verbose logging (⚠️ local only!) | `false`         |

### Available Scripts

**Root Directory:**

| Script               | Description                       |
| -------------------- | --------------------------------- |
| `npm start`          | Start full stack (Lambda + React) |
| `npm run dev:app`    | Start React app only              |
| `npm run dev:lambda` | Start Lambda server only          |
| `npm run build:all`  | Build both for production         |

**React App** (`app/`):

| Script          | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Development mode with git branch tracking |
| `npm run build` | Build app for deployment                  |

**Lambda** (`lambda/`):

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start local dev server (port 3001)   |
| `npm run build` | Create `function.zip` for AWS Lambda |

## 🐛 Troubleshooting

### "Failed to fetch" Error

**Cause:** Lambda server not running or wrong URL

**Fix:**

- Verify `REACT_APP_USE_LOCAL_LAMBDA=true` in `app/.env.local`
- Ensure Lambda server is running: `npm run dev:lambda`
- Restart React app after changing environment variables: `npm run dev:app`

### Okta "Policy evaluation failed"

**Cause:** Okta misconfiguration

**Fix:**

- Verify redirect URIs in Okta app match your app URL
- Check user is assigned to the Okta application
- Verify authorization server has a default policy

### Token Validation Failed

**Cause:** Mismatched `OKTA_ISSUER`

**Fix:**

- Ensure `OKTA_ISSUER` in `lambda/.env` matches `REACT_APP_OKTA_ISSUER` in `app/.env.local`
- Check for trailing slashes or typos

### CORS Errors

**Cause:** API Gateway CORS not configured

**Fix:**

- Enable CORS in API Gateway
- Allow `Authorization` and `X-ID-Token` headers
- Add your app origin to allowed origins

## 📚 Additional Resources

- [Superblocks Embedded Apps](https://docs.superblocks.com/applications/embedded-apps/)
- [Superblocks Embed SDK](https://docs.superblocks.com/applications/embedded-apps/embed-sdk)
- [Okta React SDK](https://github.com/okta/okta-react)
- [Setup Okta App Guide](docs/setup-okta-app.md)
- [Deploy Lambda Guide](docs/deploy-lambda.md)

## 🙋 FAQ

**Q: Can I use a different identity provider?**  
A: Yes! Update the React app to use your IdP's SDK and modify Lambda to validate their tokens.

**Q: Do I need AWS Lambda?**  
A: No, any backend that can validate tokens and exchange with Superblocks will work.

**Q: How do I handle token refresh?**  
A: Okta React SDK handles access token refresh automatically. Superblocks session is managed by the Embed SDK.

**Q: Can I embed multiple Superblocks apps?**  
A: Yes! Change `REACT_APP_SUPERBLOCKS_APPLICATION_ID` or implement routing to switch between apps.

## 📝 License

This is a sample/demo application provided for reference.
