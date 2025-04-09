import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
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
            if (client.readyState === WebSocket.OPEN) {
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
