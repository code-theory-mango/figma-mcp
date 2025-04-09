"use strict";
// --- TYPE DEFINITIONS ---
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// --- INIT UI ---
figma.showUI(__html__);
figma.ui.resize(400, 600);
// --- HELPERS ---
function getFontStyle(weight) {
    if (weight <= 100)
        return 'Thin';
    if (weight <= 200)
        return 'ExtraLight';
    if (weight <= 300)
        return 'Light';
    if (weight <= 400)
        return 'Regular';
    if (weight <= 500)
        return 'Medium';
    if (weight <= 600)
        return 'SemiBold';
    if (weight <= 700)
        return 'Bold';
    if (weight <= 800)
        return 'ExtraBold';
    if (weight >= 900)
        return 'Black';
    return 'Regular';
}
function clearPreviousDesigns() {
    const nodesToRemove = figma.currentPage.findAll(node => node.type === 'FRAME' && node.name.startsWith('Design Container'));
    console.log(`🧹 Clearing ${nodesToRemove.length} previous designs`);
    nodesToRemove.forEach(node => node.remove());
}
// --- MAIN DESIGN CREATION FUNCTION ---
function createDesign(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🎨 Processing simplified build-design payload:', payload);
        const typographyInstruction = payload.instructions.find(i => i.name === 'typography');
        if (!typographyInstruction || !typographyInstruction.content) {
            console.error('❌ No valid typography instruction or content found.');
            return;
        }
        const content = typographyInstruction.content;
        if (!content.frame || !content.textNodes || !Array.isArray(content.textNodes)) {
            console.error('❌ Invalid content structure: Missing frame or textNodes array.', content);
            return;
        }
        const frameStyle = content.frame;
        const textNodesInstructions = content.textNodes;
        const fontsToLoad = new Map();
        for (const nodeInstruction of textNodesInstructions) {
            const style = nodeInstruction.style;
            const figmaFontStyle = style.fontStyle || getFontStyle(style.fontWeight);
            const fontName = { family: style.fontFamily, style: figmaFontStyle };
            const fontKey = `${fontName.family}-${fontName.style}`;
            if (!fontsToLoad.has(fontKey)) {
                fontsToLoad.set(fontKey, fontName);
            }
        }
        if (fontsToLoad.size > 0) {
            console.log('🔄 Loading required fonts:', Array.from(fontsToLoad.values()));
            try {
                yield Promise.all(Array.from(fontsToLoad.values()).map(font => figma.loadFontAsync(font).catch(err => {
                    console.error(`❌ Failed to load font: ${font.family} ${font.style}`, err);
                })));
                console.log('✅ Font loading process complete.');
            }
            catch (err) {
                console.error('❌ Critical error during font loading phase:', err);
            }
        }
        clearPreviousDesigns();
        const container = figma.createFrame();
        container.name = frameStyle.name || 'Design Container';
        try {
            container.resize(frameStyle.width, frameStyle.height);
        }
        catch (e) {
            console.error(`❌ Error resizing container to ${frameStyle.width}x${frameStyle.height}:`, e);
            container.resize(800, 600);
        }
        container.x = 100;
        container.y = 100;
        container.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        figma.currentPage.appendChild(container);
        console.log(`✅ Created container: ${container.name} (${container.width}x${container.height})`);
        console.log(`🏗️ Processing ${textNodesInstructions.length} text nodes...`);
        for (const nodeInstruction of textNodesInstructions) {
            console.log(`  Creating node: ${nodeInstruction.name}`);
            const style = nodeInstruction.style;
            const placement = nodeInstruction.placement;
            const figmaFontStyle = style.fontStyle || getFontStyle(style.fontWeight);
            const targetFontName = { family: style.fontFamily, style: figmaFontStyle };
            try {
                const text = figma.createText();
                text.name = nodeInstruction.name;
                try {
                    text.fontName = targetFontName;
                }
                catch (fontError) {
                    console.error(`❌ Error applying font ${targetFontName.family} ${targetFontName.style}. Falling back.`, fontError);
                    yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                    text.fontName = { family: "Inter", style: "Regular" };
                }
                container.appendChild(text);
                text.characters = nodeInstruction.characters;
                text.fontSize = style.fontSize;
                if (style.color) {
                    text.fills = [{ type: 'SOLID', color: { r: style.color.r, g: style.color.g, b: style.color.b } }];
                }
                else {
                    text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                }
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
// --- LISTEN FOR UI MESSAGE TRIGGERED BY WEBSOCKET ---
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'close') {
        console.log('🛑 Closing plugin.');
        figma.closePlugin();
    }
    if (msg.type === 'websocket-instructions') {
        const serverResponse = msg.data;
        const payload = serverResponse.instructions;
        if (payload && payload.type === 'build-design' && payload.instructions) {
            console.log('✅ Received build-design payload via WebSocket. Processing...');
            yield createDesign(payload);
            figma.ui.postMessage({ type: 'status', message: 'Design updated via WebSocket!' });
        }
        else {
            console.warn('⚠️ Invalid or empty payload received via WebSocket:', payload);
        }
    }
});
