"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'ngrok-skip-browser-warning'],
    exposedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    maxAge: 86400
}));
app.use(express_1.default.json());
// Log all requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});
let connectedClients = [];
wss.on('connection', (ws) => {
    console.log('🔌 Plugin connected via WebSocket');
    connectedClients.push(ws);
    ws.on('close', () => {
        connectedClients = connectedClients.filter(c => c !== ws);
        console.log('❌ Plugin disconnected');
    });
});
// Endpoint to receive instructions from n8n
app.post('/figma-webhook', (req, res) => {
    try {
        const instructions = req.body.instructions;
        console.log("✅ Received instructions via webhook:\n", JSON.stringify(instructions, null, 2));
        // Broadcast to all connected WebSocket clients
        connectedClients.forEach(client => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(JSON.stringify({ instructions }));
            }
        });
        res.sendStatus(200);
    }
    catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// (Optional) Fallback GET endpoint if you want to support polling as backup
app.get('/get-instructions', (req, res) => {
    try {
        res.setHeader('ngrok-skip-browser-warning', '1');
        res.json({ instructions: null }); // Not used anymore
    }
    catch (error) {
        console.error('❌ Error fetching instructions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
server.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
