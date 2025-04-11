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
// <<< UPDATED FUNCTION: Create Frames from Specs (Grouped) >>>
function createFramesFromSpecs(frameData) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`📐 Grouping and creating ${frameData.length} frames from CSV data...`);
        // 1. Group frame data by size (e.g., "1920x1080")
        const groupedBySize = new Map();
        for (const spec of frameData) {
            const sizeKey = `${spec.width}x${spec.height}`;
            if (!groupedBySize.has(sizeKey)) {
                groupedBySize.set(sizeKey, []);
            }
            groupedBySize.get(sizeKey).push(spec); // Add spec to the group
        }
        console.log(`📊 Found ${groupedBySize.size} unique size groups.`);
        // --- Determine contrasting text color based on page background --- 
        let titleColor = { r: 0, g: 0, b: 0 }; // Default to black
        const pageBackgrounds = figma.currentPage.backgrounds;
        if (pageBackgrounds.length > 0 && pageBackgrounds[0].type === 'SOLID') {
            const bgColor = pageBackgrounds[0].color;
            // Calculate relative luminance (simplified check for demo)
            // A more accurate formula considers gamma correction, but this is often sufficient:
            const luminance = 0.2126 * bgColor.r + 0.7152 * bgColor.g + 0.0722 * bgColor.b;
            if (luminance < 0.5) { // If background is dark
                titleColor = { r: 1, g: 1, b: 1 }; // Use white text
                console.log(`ℹ️ Page background is dark (L=${luminance.toFixed(2)}), using white title text.`);
            }
            else {
                console.log(`ℹ️ Page background is light (L=${luminance.toFixed(2)}), using black title text.`);
            }
        }
        else {
            console.log("ℹ️ No solid page background found, defaulting title text to black.");
        }
        // --- End text color determination ---
        // Layout variables
        const startX = 100;
        let overallCurrentY = figma.currentPage.children.length > 0
            ? figma.currentPage.children.reduce((maxY, node) => Math.max(maxY, node.y + node.height), 0) + 150
            : 100; // Start below existing content or at 100
        const groupSpacingY = 500; // Increased from 80
        const titleSpacingY = 70; // Space between title and frames within a group
        const frameSpacingX = 40;
        const frameSpacingY = 40;
        const wrapWidth = figma.viewport.bounds.width * 0.8; // Wrap width for frames
        // Load font for titles
        try {
            yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
            console.log("✅ Title font loaded (Inter Bold).");
        }
        catch (e) {
            console.error("❌ Failed to load title font. Titles will use default font.", e);
            // Continue without bold titles if loading fails
        }
        // 2. Iterate through each size group
        for (const [sizeKey, framesInGroup] of groupedBySize.entries()) {
            const [groupWidth, groupHeight] = sizeKey.split('x').map(Number);
            console.log(`-- Processing Group: ${sizeKey} (${framesInGroup.length} frames) --`);
            // A. Create Size Title Text Node
            const titleText = figma.createText();
            try {
                titleText.fontName = { family: "Inter", style: "Bold" };
            }
            catch (e) { /* Font failed loading */ }
            titleText.characters = `${groupWidth} x ${groupHeight}`;
            titleText.fontSize = 80; // User modified
            titleText.fills = [{ type: 'SOLID', color: titleColor }];
            titleText.x = startX;
            titleText.y = overallCurrentY;
            figma.currentPage.appendChild(titleText);
            console.log(`  📄 Added title "${titleText.characters}" at Y=${overallCurrentY.toFixed(0)}`);
            // B. Layout Frames for this group
            let groupCurrentX = startX;
            let groupCurrentY = overallCurrentY + titleText.height + titleSpacingY; // Start frames below title
            let groupRowMaxHeight = 0;
            let groupMaxYReached = groupCurrentY; // Track lowest point *within* this group layout
            for (const spec of framesInGroup) {
                // Create frame
                console.log(`    🖼️ Creating frame: ${spec.name} (${spec.width}x${spec.height})`);
                try {
                    const frame = figma.createFrame();
                    frame.name = spec.name;
                    frame.resize(spec.width, spec.height);
                    frame.x = groupCurrentX;
                    frame.y = groupCurrentY;
                    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
                    frame.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
                    frame.strokeWeight = 1;
                    figma.currentPage.appendChild(frame);
                    // Update layout coords for next frame in group
                    groupCurrentX += frame.width + frameSpacingX;
                    groupRowMaxHeight = Math.max(groupRowMaxHeight, frame.height);
                    groupMaxYReached = Math.max(groupMaxYReached, frame.y + frame.height); // Track lowest edge
                    // Wrap within group
                    if (groupCurrentX > startX + wrapWidth && framesInGroup.indexOf(spec) < framesInGroup.length - 1) { // Don't wrap if it's the last item
                        groupCurrentX = startX;
                        groupCurrentY += groupRowMaxHeight + frameSpacingY;
                        groupRowMaxHeight = 0; // Reset for new row
                        groupMaxYReached = Math.max(groupMaxYReached, groupCurrentY); // Update needed if starting new row
                    }
                }
                catch (err) {
                    console.error(`    ❌ Error creating frame "${spec.name}":`, err);
                }
            } // End loop for frames within group
            // C. Update overall Y for the next group's title
            overallCurrentY = groupMaxYReached + groupSpacingY;
            console.log(`  -- Group ${sizeKey} finished. Next group starts at Y=${overallCurrentY.toFixed(0)} --`);
        } // End loop for size groups
        console.log('✅ Frame creation from CSV complete (grouped).');
        // Notify UI of completion (optional)
        figma.ui.postMessage({
            type: 'csv-frames-created',
            message: `Created ${frameData.length} frames, grouped by size.`
        });
    });
}
// --- Selection Handling ---
function sendSelectionUpdate() {
    const selectedFrames = figma.currentPage.selection.filter(node => node.type === 'FRAME');
    // <<< MAP to include details >>>
    const frameDetails = selectedFrames.map(frame => ({
        name: frame.name,
        id: frame.id, // Also include ID, might be useful later
        width: frame.width,
        height: frame.height,
        x: frame.x,
        y: frame.y
    }));
    // console.log('📤 Sending selection details to UI:', frameDetails); // Optional log
    // <<< Use NEW message type and send details >>>
    figma.ui.postMessage({
        type: 'update-selection-details',
        frames: frameDetails // Send the array of objects
    });
}
// Listen for selection changes in Figma
figma.on('selectionchange', () => {
    sendSelectionUpdate();
});
// --- Initial Setup ---
figma.showUI(__html__);
figma.ui.resize(400, 600);
// Send initial selection state when plugin loads
sendSelectionUpdate();
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
    if (msg.type === 'chat-message') {
        console.log("Received chat message from UI:", msg.message);
        console.log("Received frame data with message:", msg.figmaFrame); // Updated log
        const userMessage = msg.message;
        const frameData = msg.figmaFrame || []; // Get frame data from message
        const n8nWebhookUrl = 'https://candt.app.n8n.cloud/webhook-test/6b4b51bb-bb8a-4207-b57e-1cbc27eb583c';
        figma.ui.postMessage({ type: 'status', message: 'Sending message and frame data to n8n...' }); // Update status text
        try {
            console.log(`🚀 Sending message and frame data to n8n webhook: ${n8nWebhookUrl}`);
            const response = yield fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    figmaFrame: frameData // Use the new key name here
                })
            });
            console.log(`N8N Response Status: ${response.status}`);
            if (!response.ok) {
                // Try to get error details from n8n response if possible
                let errorDetails = '';
                try {
                    errorDetails = yield response.text(); // Or response.json() if n8n sends JSON errors
                    console.error("N8N Error Response Body:", errorDetails);
                }
                catch (parseError) { /* Ignore if body can't be read/parsed */ }
                throw new Error(`N8N webhook failed with status ${response.status}. ${errorDetails}`);
            }
            // Success message - n8n received it (doesn't mean processing is done)
            figma.ui.postMessage({
                type: 'chat-response',
                message: 'Message sent to n8n successfully.'
            });
            // Re-enable UI button via chat-response message in ui.html
        }
        catch (error) {
            console.error('❌ Error sending message to n8n:', error);
            // Send error back to UI
            let errorMessage = 'Unknown error occurred';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            figma.ui.postMessage({
                type: 'chat-response', // Use chat-response to display error
                message: `Error sending message: ${errorMessage}`
            });
            // Re-enable UI button via chat-response message in ui.html
        }
    }
    else if (msg.type === 'create-frames-from-csv') {
        console.log('Received create-frames-from-csv message');
        if (msg.data && Array.isArray(msg.data)) {
            createFramesFromSpecs(msg.data);
        }
        else {
            console.error('Invalid data received for frame creation:', msg.data);
        }
    }
    else if (msg.type === 'update-selection-details') {
        // This case is just for receiving selection details from code.ts within ui.html,
        // code.ts itself doesn't need to handle receiving this type from ui.html.
        // The message originates *from* code.ts, triggered by figma.on('selectionchange').
        // No action needed here unless the UI needs to send selection changes *back*.
    }
});
