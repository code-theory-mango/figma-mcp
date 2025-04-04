import express from 'express';
import cors from 'cors';
const app = express();
// Configure CORS to allow all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));
app.use(express.json());
let latestInstructions = null;
// Add OPTIONS handler for preflight requests
app.options('*', cors());
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
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json({ instructions: latestInstructions });
    }
    catch (error) {
        console.error('❌ Error fetching instructions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(3000, () => {
    console.log('🚀 Figma plugin server listening on http://localhost:3000');
});
