const express = require('express');
const cors = require('cors');
const { handler } = require('./index');

// Set development mode for debug logging
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for local development
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Lambda dev server is running' });
});

// Lambda handler endpoint
app.get('/auth', async (req, res) => {
    console.log('📨 Incoming request to /auth');
    console.log('Headers:', req.headers);

    // Transform Express request to Lambda event format
    const event = {
        headers: req.headers,
        httpMethod: req.method,
        path: req.path,
        queryStringParameters: req.query,
        body: req.body ? JSON.stringify(req.body) : null
    };

    try {
        // Invoke the Lambda handler
        console.log('🔄 Invoking Lambda handler...');
        const result = await handler(event);

        console.log('✅ Lambda handler completed');
        console.log('Status:', result.statusCode);

        // Transform Lambda response to Express response
        res.status(result.statusCode);

        if (result.headers) {
            Object.keys(result.headers).forEach(key => {
                res.set(key, result.headers[key]);
            });
        }

        // Parse body if it's a string
        let body = result.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                // Keep as string if not valid JSON
            }
        }

        res.json(body);
    } catch (error) {
        console.error('❌ Error invoking Lambda handler:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('\n🚀 Lambda Development Server Started!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🔗 Auth endpoint: http://localhost:${PORT}/auth`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Configure your React app to use: http://localhost:3001/auth');
    console.log('   Set REACT_APP_USE_LOCAL_LAMBDA=true in app/.env.local');
    console.log('🔄 Hot reloading enabled - edit index.js to see changes\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down Lambda dev server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Lambda dev server...');
    process.exit(0);
});

