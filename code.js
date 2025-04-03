"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__);
figma.ui.resize(400, 600);
// Listen for messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'chat-message') {
        const userMessage = msg.message;
        try {
            // Send POST request to n8n webhook
            const response = yield fetch('https://candt.app.n8n.cloud/webhook/6b4b51bb-bb8a-4207-b57e-1cbc27eb583c', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    timestamp: new Date().toISOString()
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
            // Send response back to UI
            figma.ui.postMessage({
                type: 'chat-response',
                message: data.response || 'Message sent successfully!'
            });
        }
        catch (error) {
            console.error('Error:', error);
            figma.ui.postMessage({
                type: 'chat-response',
                message: 'Sorry, there was an error processing your request.'
            });
        }
    }
    // ✅ NEW: Handle design instructions coming back from n8n
    if (msg.type === 'build-design' && msg.instructions) {
        const instructions = msg.instructions;
        for (const block of instructions) {
            if (block.name === 'typography' && block.type === 'json') {
                const content = block.content;
                for (const [role, { nodeId, position }] of Object.entries(content)) {
                    try {
                        const component = yield figma.importComponentByKeyAsync(nodeId);
                        const instance = component.createInstance();
                        figma.currentPage.appendChild(instance);
                        // Placeholder layout logic — update as needed
                        instance.x = 100;
                        instance.y = 100 + (Object.keys(content).indexOf(role) * 200);
                    }
                    catch (err) {
                        console.error(`Error importing ${role} from ${nodeId}:`, err);
                    }
                }
            }
        }
        figma.ui.postMessage({
            type: 'design-built',
            message: 'Design placed on canvas.'
        });
    }
    // Make sure to close the plugin when receiving the close message
    if (msg.type === 'close') {
        figma.closePlugin();
    }
});
