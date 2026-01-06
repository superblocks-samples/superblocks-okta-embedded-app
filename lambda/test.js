// test.js  
const lambdaHandler = require('./index'); // Adjust the path if needed  

// Sample event mimicking the incoming API Gateway request  
const sampleEvent = {
    headers: {
        Authorization: `Bearer ${process.env.OKTA_ACCESS_TOKEN}`,
        'X-ID-Token': process.env.OKTA_ID_TOKEN
    },
};

// Invoke the Lambda function locally  
lambdaHandler.handler(sampleEvent)
    .then(response => {
        console.log('Response:', response);
    })
    .catch(err => {
        console.error('Error:', err);
    });  