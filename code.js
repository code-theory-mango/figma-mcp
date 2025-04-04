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
// 🔁 Polling for instructions from server
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄 Polling for instructions...');
        try {
            const url = 'https://167f-38-74-197-217.ngrok-free.app/get-instructions';
            console.log('📡 Fetching from:', url);
            const res = yield fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            console.log('📥 Response status:', res.status);
            const text = yield res.text();
            console.log('📄 Raw response text:', text);
            // Check if the response starts with <!DOCTYPE> or <html>
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('❌ Received HTML instead of JSON');
                console.error('HTML content:', text.substring(0, 200) + '...');
                return;
            }
            if (!text || text.trim() === '') {
                console.log('Empty response received');
                return;
            }
            let data;
            try {
                data = JSON.parse(text);
            }
            catch (e) {
                console.error('❌ Failed to parse JSON:', e);
                console.error('Raw text:', text);
                return;
            }
            console.log('🎯 Parsed data:', data);
            if (!data.instructions) {
                console.log('ℹ️ No instructions in response');
                return;
            }
            console.log("📦 Received instructions from server:", data.instructions);
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
            console.error('❌ Error in polling loop:', err);
        }
    }
    catch (err) {
        console.log('⚠️ No instructions found or polling failed.', err);
    }
}), 3000); // Poll every 3 seconds
// 💬 Handle UI messages
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'close') {
        figma.closePlugin();
    }
});
