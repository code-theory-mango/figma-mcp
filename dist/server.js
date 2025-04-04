"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Configure CORS to allow all origins
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));
app.use(express_1.default.json());
let latestInstructions = null;
// Add OPTIONS handler for preflight requests
app.options('*', (0, cors_1.default)());
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
