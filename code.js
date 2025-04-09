"use strict";
// Helper function to convert hex colors to RGB values between 0-1
// No longer needed if colors are provided in RGBA format
// function hexToRgb(hex: string) { ... }
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// --- END OF NEW TYPE DEFINITIONS ---
figma.showUI(__html__);
figma.ui.resize(400, 600);
// Helper function to map fontWeight to style (keep as is)
function getFontStyle(weight) {
    if (weight <= 100)
        return 'Thin';
    if (weight <= 200)
        return 'ExtraLight';
    if (weight <= 300)
        return 'Light';
    if (weight <= 400)
        return 'Regular'; // Common default
    if (weight <= 500)
        return 'Medium';
    if (weight <= 600)
        return 'SemiBold';
    if (weight <= 700)
        return 'Bold'; // Common bold
    if (weight <= 800)
        return 'ExtraBold';
    if (weight >= 900)
        return 'Black'; // Common heavier weight
    return 'Regular'; // Default fallback
}
// Helper function to clear previous designs (keep as is)
function clearPreviousDesigns() {
    const nodesToRemove = figma.currentPage.findAll(node => node.type === 'FRAME' && node.name.startsWith('Design Container') // Match by prefix
    );
    console.log(`🧹 Clearing ${nodesToRemove.length} previous designs`);
    nodesToRemove.forEach(node => node.remove());
}
// --- REFACTORED createDesign ---
function createDesign(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🎨 Processing simplified build-design payload:', payload);
        const typographyInstruction = payload.instructions.find(i => i.name === 'typography');
        if (!typographyInstruction || !typographyInstruction.content) {
            console.error('❌ No valid typography instruction or content found.');
            return;
        }
        // Directly use the content structure
        const content = typographyInstruction.content;
        // Validate the necessary parts
        if (!content.frame || !content.textNodes || !Array.isArray(content.textNodes)) {
            console.error('❌ Invalid content structure: Missing frame or textNodes array.', content);
            return;
        }
        const frameStyle = content.frame;
        const textNodesInstructions = content.textNodes;
        // --- 1. Preload Fonts ---
        const fontsToLoad = new Map();
        for (const nodeInstruction of textNodesInstructions) {
            const style = nodeInstruction.style;
            // Prefer explicit fontStyle, fallback to fontWeight mapping
            const figmaFontStyle = style.fontStyle ? style.fontStyle : getFontStyle(style.fontWeight);
            const fontName = { family: style.fontFamily, style: figmaFontStyle };
            const fontKey = `${fontName.family}-${fontName.style}`;
            if (!fontsToLoad.has(fontKey)) {
                fontsToLoad.set(fontKey, fontName);
            }
        }
        if (fontsToLoad.size > 0) {
            console.log('🔄 Loading required fonts:', Array.from(fontsToLoad.values()));
            try {
                yield Promise.all(Array.from(fontsToLoad.values()).map(font => {
                    console.log(`  Attempting to load: ${font.family} ${font.style}`);
                    return figma.loadFontAsync(font).catch(err => {
                        console.error(`❌ Failed to load font: ${font.family} ${font.style}`, err);
                        // Don't halt Promise.all, but log error
                    });
                }));
                console.log('✅ Font loading process complete.');
            }
            catch (err) {
                console.error('❌ Critical error during font loading phase:', err);
                // Decide if we should stop here
                // return;
            }
        }
        // --- 2. Clear & Create Frame ---
        clearPreviousDesigns();
        const container = figma.createFrame();
        container.name = frameStyle.name || 'Design Container'; // Use name from JSON or default
        try {
            container.resize(frameStyle.width, frameStyle.height);
        }
        catch (e) {
            console.error(`❌ Error resizing container to ${frameStyle.width}x${frameStyle.height}:`, e);
            container.resize(800, 600); // Fallback size
        }
        container.x = 100; // Keep fixed position for now
        container.y = 100;
        container.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // Default white background
        // TODO: Add background color from frameStyle if defined later
        figma.currentPage.appendChild(container);
        console.log(`✅ Created container: ${container.name} (${container.width}x${container.height})`);
        // --- 3. Create Text Nodes ---
        console.log(`🏗️ Processing ${textNodesInstructions.length} text nodes...`);
        for (const nodeInstruction of textNodesInstructions) {
            console.log(`  Creating node: ${nodeInstruction.name}`);
            const style = nodeInstruction.style;
            const placement = nodeInstruction.placement;
            const figmaFontStyle = style.fontStyle ? style.fontStyle : getFontStyle(style.fontWeight);
            const targetFontName = { family: style.fontFamily, style: figmaFontStyle };
            try {
                const text = figma.createText();
                text.name = nodeInstruction.name; // Use name from JSON
                // Apply Font Name First
                try {
                    text.fontName = targetFontName;
                }
                catch (fontError) {
                    console.error(`❌ Error applying font ${targetFontName.family} ${targetFontName.style}. Was it loaded? Falling back.`, fontError);
                    yield figma.loadFontAsync({ family: "Inter", style: "Regular" }); // Ensure fallback is loaded
                    text.fontName = { family: "Inter", style: "Regular" };
                }
                // Append to container
                container.appendChild(text);
                // Apply Content
                text.characters = nodeInstruction.characters;
                // Apply Styles (with defaults for optional ones)
                text.fontSize = style.fontSize;
                if (style.color) {
                    // Figma uses 0-1 range, assume JSON provides this if color exists
                    text.fills = [{ type: 'SOLID', color: { r: style.color.r, g: style.color.g, b: style.color.b } }];
                }
                else {
                    text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; // Default black
                }
                // Optional styles - apply only if present in JSON
                // text.textAlignHorizontal = (style.textAlign?.toUpperCase() || 'LEFT') as ...; // Example if added later
                // text.textCase = (style.textCase?.toUpperCase() || 'ORIGINAL') as ...; // Example if added later
                // if (style.letterSpacing !== undefined) { ... } // Example if added later
                // if (style.lineHeight !== undefined) { ... } // Example if added later
                // Apply Placement
                text.x = placement.x;
                text.y = placement.y;
                console.log(`  ✅ Node "${text.name}" created at (${text.x}, ${text.y})`);
            }
            catch (err) {
                console.error(`❌ Error processing node "${nodeInstruction.name}":`, err);
            }
        }
        console.log('✅ Design creation complete.');
    });
}
// Poll for instructions - Still expecting OBJECT { instructions: PAYLOAD } from server
function pollForInstructions() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const NGROK_URL = 'https://452c-38-74-197-217.ngrok-free.app';
            const urlWithCacheBuster = `${NGROK_URL}/get-instructions?t=${Date.now()}`;
            console.log(`📡 Polling ${urlWithCacheBuster}...`);
            const res = yield fetch(urlWithCacheBuster, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1'
                }
            });
            console.log(`📊 Poll response status: ${res.status}`);
            if (!res.ok) {
                if (res.status === 204) {
                    console.log('ℹ️ No new instructions available (204 No Content).');
                    return;
                }
                const errorText = yield res.text();
                throw new Error(`Failed to get instructions: ${res.status} ${res.statusText}. Response: ${errorText}`);
            }
            const responseText = yield res.text();
            if (!responseText) {
                console.log('ℹ️ Received empty response body.');
                return;
            }
            // Parse the wrapper object { instructions: ... }
            const serverResponse = JSON.parse(responseText);
            console.log('📥 Received server wrapper:', serverResponse);
            // Extract the actual payload (which can be null if server sent {instructions: null})
            const payload = serverResponse.instructions;
            console.log('▶️ Extracted payload:', payload);
            // Check if payload exists and is the correct type
            if (payload && payload.type === 'build-design' && payload.instructions) {
                console.log('✅ Received valid build-design payload. Processing...');
                yield createDesign(payload); // Pass the extracted payload
                figma.ui.postMessage({ type: 'status', message: 'Design updated!' });
            }
            else if (payload) {
                // Payload exists but is wrong type or missing internal instructions array
                console.warn('⚠️ Extracted payload is not valid build-design:', payload);
            }
            else {
                // instructions property was null or missing in the server response
                console.log('ℹ️ No payload found in serverResponse.instructions.');
            }
        }
        catch (err) {
            console.error('❌ Error during polling or processing:', err);
            figma.ui.postMessage({
                type: 'status',
                message: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
            });
        }
    });
}
// Start polling
pollForInstructions(); // Initial call
const pollIntervalId = setInterval(pollForInstructions, 8000); // Poll every 8 seconds
// Handle UI messages
figma.ui.onmessage = msg => {
    if (msg.type === 'close') {
        console.log('🛑 Closing plugin and stopping polling.');
        clearInterval(pollIntervalId); // Stop polling when UI closes
        figma.closePlugin();
    }
};
