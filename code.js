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
// Poll for instructions from server
const pollForInstructions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄 Polling for instructions...');
        const url = 'https://fdd3-38-74-197-217.ngrok-free.app/get-instructions';
        console.log('📡 Fetching from:', url);
        const res = yield fetch(url, {
            headers: {
                'ngrok-skip-browser-warning': '1'
            }
        });
        console.log('📥 Response status:', res.status);
        const text = yield res.text();
        console.log('📄 Raw response:', text);
        if (text.includes('<!DOCTYPE html>')) {
            console.error('❌ Received HTML instead of JSON');
            return;
        }
        const data = JSON.parse(text);
        console.log('✅ Parsed response:', data);
        if (!data.instructions) {
            console.log('ℹ️ No instructions available');
            return;
        }
        // Handle the instructions
        if (data.instructions.name === 'typography' && data.instructions.type === 'json') {
            const content = data.instructions.content;
            console.log('🎨 Processing typography instructions:', content);
            for (const [role, { nodeId, position }] of Object.entries(content)) {
                try {
                    console.log(`🔍 Importing component for ${role} with ID ${nodeId}`);
                    const component = yield figma.importComponentByKeyAsync(nodeId);
                    const instance = component.createInstance();
                    figma.currentPage.appendChild(instance);
                    instance.x = 100;
                    instance.y = 100 + Object.keys(content).indexOf(role) * 200;
                    console.log(`✅ Placed ${role} component at x:${instance.x}, y:${instance.y}`);
                }
                catch (err) {
                    console.error(`❌ Error importing ${role} from ${nodeId}:`, err);
                }
            }
        }
    }
    catch (err) {
        console.error('❌ Error:', err);
    }
});
// Poll immediately and every 5 seconds
pollForInstructions();
setInterval(pollForInstructions, 5000);
// Handle UI messages
figma.ui.onmessage = msg => {
    if (msg.type === 'close') {
        figma.closePlugin();
    }
};
