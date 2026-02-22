# Deploying the Lambda Function

For local development setup, see the [README](../README.md#-quick-start--local-development).

## Prerequisites

- An AWS account with appropriate permissions
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- AWS CLI installed and configured with `aws configure`

## 1. Create the Secrets Manager Secret

Store your Superblocks embed access token in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
    --name superblocks/embed-access-token \
    --secret-string "your-superblocks-embed-access-token"
```

Note the ARN from the output — you'll need it during deployment.

## 2. Build

```bash
cd lambda
sam build
```

## 3. Deploy (First Time)

```bash
sam deploy --guided
```

SAM will prompt you for the following parameters:

| Parameter                  | Description                                        | Example                                                |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `OktaIssuer`               | Okta Authorization Server Issuer URL               | `https://dev-12345.okta.com/oauth2/default`            |
| `OktaAudience`             | Expected audience claim (defaults to `api://default`) | `api://default`                                     |
| `SuperblocksUrl`           | Superblocks instance URL                           | `https://app.superblocks.com`                          |
| `SuperblocksTokenSecretArn`| ARN of the Secrets Manager secret from step 1      | `arn:aws:secretsmanager:us-west-2:123456:secret:...`   |

Your choices are saved to `samconfig.toml` for future deploys.

## 4. Deploy (Subsequent)

```bash
sam deploy
```

## 5. Verify

After deployment, SAM outputs the `AuthEndpoint` URL. Test it with curl:

```bash
curl -X POST "https://<api-id>.execute-api.<region>.amazonaws.com/oauth2/token" \
    -H "Authorization: Bearer $OKTA_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"id_token": "'$OKTA_ID_TOKEN'"}'
```

## Updating the Secret

To rotate the Superblocks embed access token:

```bash
aws secretsmanager put-secret-value \
    --secret-id superblocks/embed-access-token \
    --secret-string "new-superblocks-embed-access-token"
```

The Lambda will pick up the new value on the next cold start (or you can redeploy to force it).

## Tearing Down

```bash
cd lambda
sam delete
```

This removes the Lambda function, API Gateway, and IAM role. The Secrets Manager secret is **not** deleted — remove it separately if needed:

```bash
aws secretsmanager delete-secret --secret-id superblocks/embed-access-token
```
