import express from 'express';
import cors from 'cors';
const app = express();
// Configure CORS to allow all origins and handle preflight
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'ngrok-skip-browser-warning'],
    exposedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    maxAge: 86400
}));
app.use(express.json());
// Log all requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});
let latestInstructions = null;
// Endpoint to receive instructions from n8n
app.post('/figma-webhook', (req, res) => {
    try {
        latestInstructions = req.body.instructions;
        console.log('✅ Received instructions via webhook:', latestInstructions);
        res.sendStatus(200);
    }
    catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Endpoint for the plugin to fetch instructions
app.get('/get-instructions', (req, res) => {
    try {
        // Set header to prevent ngrok warning page
        res.setHeader('ngrok-skip-browser-warning', '1');
        res.json({ instructions: latestInstructions });
        console.log('📤 Sending instructions:', latestInstructions);
    }
    catch (error) {
        console.error('❌ Error fetching instructions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
