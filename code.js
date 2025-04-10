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
        const logoInstructions = content.logos || [];
        // --- 1. Preload Fonts ---
        const fontsToLoad = new Map();
        for (const nodeInstruction of textNodesInstructions) {
            const style = nodeInstruction.style;
            if (!style.fontFamily) {
                console.warn(`  ⚠️ Skipping font loading for node "${nodeInstruction.name}" due to missing fontFamily.`);
                continue;
            }
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
        // --- 3. Create Text Nodes ---
        console.log(`🏗️ Processing ${textNodesInstructions.length} text nodes...`);
        for (const nodeInstruction of textNodesInstructions) {
            console.log(`  Creating node: ${nodeInstruction.name}`);
            const style = nodeInstruction.style;
            const placement = nodeInstruction.placement;
            const figmaFontStyle = style.fontStyle ? style.fontStyle : getFontStyle(style.fontWeight);
            const targetFontName = { family: style.fontFamily || "Inter", style: figmaFontStyle };
            try {
                const text = figma.createText();
                text.name = nodeInstruction.name;
                try {
                    if (style.fontFamily) {
                        text.fontName = targetFontName;
                    }
                    else {
                        throw new Error("fontFamily was empty, using fallback.");
                    }
                }
                catch (fontError) {
                    console.error(`❌ Error applying font ${targetFontName.family} ${targetFontName.style}. Was it loaded? Falling back.`, fontError);
                    yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
                    text.fontName = { family: "Inter", style: "Regular" };
                }
                container.appendChild(text);
                text.characters = nodeInstruction.characters;
                const fontSize = style.fontSize;
                if (fontSize && fontSize >= 1) {
                    text.fontSize = fontSize;
                }
                else {
                    console.warn(`  ⚠️ Invalid fontSize (${fontSize}) for node "${nodeInstruction.name}". Using default 12.`);
                    text.fontSize = 12;
                }
                if (style.color) {
                    text.fills = [{ type: 'SOLID', color: { r: style.color.r, g: style.color.g, b: style.color.b } }];
                }
                else {
                    text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
                }
                text.x = placement.x;
                text.y = placement.y;
                console.log(`  ✅ Node "${nodeInstruction.name}" created at (${text.x}, ${text.y})`);
            }
            catch (err) {
                console.error(`❌ Error processing node "${nodeInstruction.name}":`, err);
            }
        }
        // --- 4. Create Logo Instances ---
        console.log(`🖼️ Processing ${logoInstructions.length} logos...`);
        for (const logoInstruction of logoInstructions) {
            console.log(`  Creating logo: ${logoInstruction.name}`);
            if (!logoInstruction.componentKey) {
                console.warn(`    ⚠️ Skipping logo "${logoInstruction.name}" - Missing componentKey in instruction.`);
                continue;
            }
            try {
                // Import the component using the key
                console.log(`    🔄 Importing component key: ${logoInstruction.componentKey}`);
                const component = yield figma.importComponentByKeyAsync(logoInstruction.componentKey);
                // Create an instance of the component
                const instance = component.createInstance();
                instance.name = logoInstruction.name; // Set name
                container.appendChild(instance); // Add to container
                // Apply dimensions (Resize the instance)
                if (logoInstruction.dimensions) {
                    instance.resize(logoInstruction.dimensions.width, logoInstruction.dimensions.height);
                    console.log(`    📏 Resized to ${logoInstruction.dimensions.width}x${logoInstruction.dimensions.height}`);
                }
                // Apply placement
                if (logoInstruction.placement) {
                    instance.x = logoInstruction.placement.x;
                    instance.y = logoInstruction.placement.y;
                    console.log(`    📍 Placed at (${instance.x}, ${instance.y})`);
                }
                // TODO: Handle alignment if needed later
                console.log(`    ✅ Logo instance "${instance.name}" created.`);
            }
            catch (err) {
                console.error(`❌ Error processing logo "${logoInstruction.name}" with key "${logoInstruction.componentKey}":`, err);
            }
        }
        console.log('✅ Design creation complete.');
    });
}
// <<< NEW FUNCTION: Create Frames from Specs >>>
function createFramesFromSpecs(frameData) {
    console.log(`📐 Creating ${frameData.length} frames from CSV data...`);
    // Simple layout variables
    const startX = 100;
    const startY = figma.currentPage.children.length * 100 + 300; // Start below existing content
    const spacingX = 50;
    const spacingY = 50;
    let currentX = startX;
    let currentY = startY;
    let rowMaxHeight = 0;
    const wrapWidth = figma.viewport.bounds.width * 0.8; // Wrap roughly within viewport width
    for (const spec of frameData) {
        console.log(`  Creating frame: ${spec.name} (${spec.width}x${spec.height})`);
        try {
            const frame = figma.createFrame();
            frame.name = spec.name; // Use name from CSV
            frame.resize(spec.width, spec.height);
            frame.x = currentX;
            frame.y = currentY;
            // Simple white fill
            frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            // Add stroke for visibility
            frame.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
            frame.strokeWeight = 1;
            figma.currentPage.appendChild(frame);
            // Update layout position for next frame
            currentX += frame.width + spacingX;
            rowMaxHeight = Math.max(rowMaxHeight, frame.height);
            // Wrap to next row if needed
            if (currentX > startX + wrapWidth) {
                currentX = startX;
                currentY += rowMaxHeight + spacingY;
                rowMaxHeight = 0; // Reset for new row
            }
        }
        catch (err) {
            console.error(`❌ Error creating frame "${spec.name}":`, err);
            // Optionally notify UI: figma.ui.postMessage({ type: 'error', ... });
        }
    }
    console.log('✅ Frame creation from CSV complete.');
    // Notify UI of completion (optional)
    figma.ui.postMessage({
        type: 'csv-frames-created',
        message: `Created ${frameData.length} frames.`
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
    // <<< ADDED: Handle new message type >>>
    if (msg.type === 'create-frames-from-csv') {
        console.log('Received create-frames-from-csv message');
        if (msg.data && Array.isArray(msg.data)) {
            createFramesFromSpecs(msg.data);
        }
        else {
            console.error('Invalid data received for frame creation:', msg.data);
        }
    }
});
