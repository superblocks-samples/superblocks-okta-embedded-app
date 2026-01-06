# Deploying Lambda Auth Function

## Prerequisites

Before deploying your Lambda function, ensure that you have the following:

- An AWS account with appropriate permissions
- AWS CLI installed and configured with `aws configure`
- An IAM role with the necessary permissions for Lambda and API Gateway

## Deploying the Lambda Function

1. **Install Lambda Dependencies**

   Ensure that all dependencies are installed for the lambda function by running:

   ```bash
   npm install
   ```

2. **Package the Lambda Function**

   Prepare the Lambda function for deployment by creating a zip file containing your function code and dependencies. Run:

   ```bash
   npm run build:lambda
   ```

3. **Deploy the Lambda Function**

   Use the AWS CLI to create a new Lambda function. Replace `<YOUR_FUNCTION_NAME>` and `<YOUR_ROLE_ARN>` with your respective values.

   ```bash
   aws lambda create-function \
       --function-name <YOUR_FUNCTION_NAME> \
       --zip-file fileb://lambda/function.zip \
       --handler index.handler \
       --runtime nodejs20.x \
       --role <YOUR_ROLE_ARN>
   ```

4. **Set Up Environment Variables and Secrets**

   Configure the following environment variables using the following command:

   ```bash
   aws lambda update-function-configuration \
       --function-name <YOUR_FUNCTION_NAME> \
       --environment "Variables={SUPERBLOCKS_URL='https://app.superblocks.com',SUPERBLOCKS_EMBED_ACCESS_TOKEN='your_superblocks_token',OKTA_ISSUER='your_okta_issuer'}"
   ```

   Replace with the following values:

   - `SUPERBLOCKS_URL`: (Optional) Base URL of your Superblocks instance in the format `https://<your-instance>.superblocks.com`. Defaults to `https://app.superblocks.com` if not set. Use this if you have a custom domain or on-premise installation.
   - `SUPERBLOCKS_EMBED_ACCESS_TOKEN`: [Embed access token](https://docs.superblocks.com/administration/security/access-tokens#api-authentication) to use with the session API
   - `OKTA_ISSUER`: Okta issuer URL associated with your [Okta OIDC app](./setup-okta-app.md) (e.g., `https://dev-12345.okta.com/oauth2/default`)

## Setting Up API Gateway

Expose the Lambda function through an API Gateway, follow these steps:

1. **Create a New API**

   - Go to the [API Gateway console](https://console.aws.amazon.com/apigateway)
   - Click on **Create API** and select **HTTP API**
   - Click on **Build**

2. **Configure the API**

   - Under the **Configure routes** section, set the **Route** to `/oauth/token`
   - Select **Add Integration** and choose **Lambda**
   - Choose the Lambda function you deployed in the previous section

3. **Set the Integration Type**

   - Set the integration type to be **Lambda Function**
   - Choose the region where your Lambda function is deployed and select your Lambda function from the dropdown

4. **Enable CORS**

   To let the React app make requests to the Lambda function via the API Gateway, you need to enable CORS:

   - In the API Gateway console, select your API
   - Go to the **CORS** settings
   - Under **CORS Configuration**, you can specify the allowed origins. For example, to allow requests from the React app running on `http://localhost:3000`, you should add that URL
   - You can also configure allowed HTTP methods (`GET`) and headers (`Authorization`, `X-ID-Token`, `Content-Type`) that the React app sends with the requests

5. **Deploy the API**

   - Click on **Next** until you reach the **Deployments** section
   - Click on **Create** to deploy your API
   - Once the API is created, note the **Invoke URL** displayed. This URL will be used to access your Lambda function

6. **Test the API**

   You can now test the API by sending a request to `https://<your-api-id>.execute-api.<region>.amazonaws.com/oauth/token`. You can use tools like Postman or curl to send requests
