"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/utils.ts
  function getFontStyle(weight) {
    if (weight <= 100)
      return "Thin";
    if (weight <= 200)
      return "ExtraLight";
    if (weight <= 300)
      return "Light";
    if (weight <= 400)
      return "Regular";
    if (weight <= 500)
      return "Medium";
    if (weight <= 600)
      return "SemiBold";
    if (weight <= 700)
      return "Bold";
    if (weight <= 800)
      return "ExtraBold";
    if (weight >= 900)
      return "Black";
    return "Regular";
  }
  var init_utils = __esm({
    "src/utils.ts"() {
      "use strict";
    }
  });

  // src/figma-helpers.ts
  function clearPreviousDesigns() {
    const nodesToRemove = figma.currentPage.findAll(
      (node) => node.type === "FRAME" && node.name.startsWith("Design Container")
    );
    console.log(`\u{1F9F9} Clearing ${nodesToRemove.length} previous designs`);
    nodesToRemove.forEach((node) => node.remove());
  }
  function createDesign(payload) {
    return __async(this, null, function* () {
      console.log("\u{1F3A8} Processing simplified build-design payload:", payload);
      const typographyInstruction = payload.instructions.find((i) => i.name === "typography");
      if (!typographyInstruction || !typographyInstruction.content) {
        console.error("\u274C No valid typography instruction or content found.");
        return;
      }
      const content = typographyInstruction.content;
      if (!content.frame || !content.textNodes || !Array.isArray(content.textNodes)) {
        console.error("\u274C Invalid content structure: Missing frame or textNodes array.", content);
        return;
      }
      const frameStyle = content.frame;
      const textNodesInstructions = content.textNodes;
      const logoInstructions = content.logos || [];
      const fontsToLoad = /* @__PURE__ */ new Map();
      for (const nodeInstruction of textNodesInstructions) {
        const style = nodeInstruction.style;
        if (!style.fontFamily) {
          console.warn(`  \u26A0\uFE0F Skipping font loading for node "${nodeInstruction.name}" due to missing fontFamily.`);
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
        console.log("\u{1F504} Loading required fonts:", Array.from(fontsToLoad.values()));
        try {
          yield Promise.all(Array.from(fontsToLoad.values()).map(
            (font) => figma.loadFontAsync(font).catch((err) => {
              console.error(`\u274C Failed to load font: ${font.family} ${font.style}`, err);
            })
          ));
          console.log("\u2705 Font loading process complete.");
        } catch (err) {
          console.error("\u274C Critical error during font loading phase:", err);
        }
      }
      clearPreviousDesigns();
      const container = figma.createFrame();
      container.name = frameStyle.name || "Design Container";
      try {
        container.resize(frameStyle.width, frameStyle.height);
      } catch (e) {
        console.error(`\u274C Error resizing container to ${frameStyle.width}x${frameStyle.height}:`, e);
        container.resize(800, 600);
      }
      container.x = 100;
      container.y = 100;
      container.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      figma.currentPage.appendChild(container);
      console.log(`\u2705 Created container: ${container.name} (${container.width}x${container.height})`);
      console.log(`\u{1F3D7}\uFE0F Processing ${textNodesInstructions.length} text nodes...`);
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
            } else {
              throw new Error("fontFamily was empty, using fallback.");
            }
          } catch (fontError) {
            console.error(`\u274C Error applying font ${targetFontName.family} ${targetFontName.style}. Was it loaded? Falling back.`, fontError);
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            text.fontName = { family: "Inter", style: "Regular" };
          }
          container.appendChild(text);
          text.characters = nodeInstruction.characters;
          const fontSize = style.fontSize;
          if (fontSize && fontSize >= 1) {
            text.fontSize = fontSize;
          } else {
            console.warn(`  \u26A0\uFE0F Invalid fontSize (${fontSize}) for node "${nodeInstruction.name}". Using default 12.`);
            text.fontSize = 12;
          }
          if (style.color) {
            text.fills = [{ type: "SOLID", color: { r: style.color.r, g: style.color.g, b: style.color.b } }];
          } else {
            text.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
          }
          text.x = placement.x;
          text.y = placement.y;
          console.log(`  \u2705 Node "${nodeInstruction.name}" created at (${text.x}, ${text.y})`);
        } catch (err) {
          console.error(`\u274C Error processing node "${nodeInstruction.name}":`, err);
        }
      }
      console.log(`\u{1F5BC}\uFE0F Processing ${logoInstructions.length} logos...`);
      for (const logoInstruction of logoInstructions) {
        console.log(`  Creating logo: ${logoInstruction.name}`);
        if (!logoInstruction.componentKey) {
          console.warn(`    \u26A0\uFE0F Skipping logo "${logoInstruction.name}" - Missing componentKey in instruction.`);
          continue;
        }
        try {
          console.log(`    \u{1F504} Importing component key: ${logoInstruction.componentKey}`);
          const component = yield figma.importComponentByKeyAsync(logoInstruction.componentKey);
          const instance = component.createInstance();
          instance.name = logoInstruction.name;
          container.appendChild(instance);
          if (logoInstruction.dimensions) {
            instance.resize(logoInstruction.dimensions.width, logoInstruction.dimensions.height);
            console.log(`    \u{1F4CF} Resized to ${logoInstruction.dimensions.width}x${logoInstruction.dimensions.height}`);
          }
          if (logoInstruction.placement) {
            instance.x = logoInstruction.placement.x;
            instance.y = logoInstruction.placement.y;
            console.log(`    \u{1F4CD} Placed at (${instance.x}, ${instance.y})`);
          }
          console.log(`    \u2705 Logo instance "${instance.name}" created.`);
        } catch (err) {
          console.error(`\u274C Error processing logo "${logoInstruction.name}" with key "${logoInstruction.componentKey}":`, err);
        }
      }
      console.log("\u2705 Design creation complete.");
    });
  }
  function createFramesFromSpecs(frameData) {
    return __async(this, null, function* () {
      console.log(`\u{1F4D0} Grouping and creating ${frameData.length} frames from CSV data...`);
      const groupedBySize = /* @__PURE__ */ new Map();
      for (const spec of frameData) {
        const sizeKey = `${spec.width}x${spec.height}`;
        if (!groupedBySize.has(sizeKey)) {
          groupedBySize.set(sizeKey, []);
        }
        groupedBySize.get(sizeKey).push(spec);
      }
      console.log(`\u{1F4CA} Found ${groupedBySize.size} unique size groups.`);
      let titleColor = { r: 0, g: 0, b: 0 };
      const pageBackgrounds = figma.currentPage.backgrounds;
      if (pageBackgrounds.length > 0 && pageBackgrounds[0].type === "SOLID") {
        const bgColor = pageBackgrounds[0].color;
        const luminance = 0.2126 * bgColor.r + 0.7152 * bgColor.g + 0.0722 * bgColor.b;
        if (luminance < 0.5) {
          titleColor = { r: 1, g: 1, b: 1 };
          console.log(`\u2139\uFE0F Page background is dark (L=${luminance.toFixed(2)}), using white title text.`);
        } else {
          console.log(`\u2139\uFE0F Page background is light (L=${luminance.toFixed(2)}), using black title text.`);
        }
      } else {
        console.log("\u2139\uFE0F No solid page background found, defaulting title text to black.");
      }
      const startX = 100;
      let overallCurrentY = figma.currentPage.children.length > 0 ? figma.currentPage.children.reduce((maxY, node) => Math.max(maxY, node.y + node.height), 0) + 150 : 100;
      const groupSpacingY = 500;
      const titleSpacingY = 70;
      const frameSpacingX = 40;
      const frameSpacingY = 40;
      const wrapWidth = figma.viewport.bounds.width * 0.8;
      try {
        yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
        console.log("\u2705 Title font loaded (Inter Bold).");
      } catch (e) {
        console.error("\u274C Failed to load title font. Titles will use default font.", e);
      }
      for (const [sizeKey, framesInGroup] of groupedBySize.entries()) {
        const [groupWidth, groupHeight] = sizeKey.split("x").map(Number);
        console.log(`-- Processing Group: ${sizeKey} (${framesInGroup.length} frames) --`);
        const titleText = figma.createText();
        try {
          titleText.fontName = { family: "Inter", style: "Bold" };
        } catch (e) {
        }
        titleText.characters = `${groupWidth} x ${groupHeight}`;
        titleText.fontSize = 80;
        titleText.fills = [{ type: "SOLID", color: titleColor }];
        titleText.x = startX;
        titleText.y = overallCurrentY;
        figma.currentPage.appendChild(titleText);
        console.log(`  \u{1F4C4} Added title "${titleText.characters}" at Y=${overallCurrentY.toFixed(0)}`);
        let groupCurrentX = startX;
        let groupCurrentY = overallCurrentY + titleText.height + titleSpacingY;
        let groupRowMaxHeight = 0;
        let groupMaxYReached = groupCurrentY;
        for (const spec of framesInGroup) {
          console.log(`    \u{1F5BC}\uFE0F Creating frame: ${spec.name} (${spec.width}x${spec.height})`);
          try {
            const frame = figma.createFrame();
            frame.name = spec.name;
            frame.resize(spec.width, spec.height);
            frame.x = groupCurrentX;
            frame.y = groupCurrentY;
            frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            frame.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
            frame.strokeWeight = 1;
            figma.currentPage.appendChild(frame);
            groupCurrentX += frame.width + frameSpacingX;
            groupRowMaxHeight = Math.max(groupRowMaxHeight, frame.height);
            groupMaxYReached = Math.max(groupMaxYReached, frame.y + frame.height);
            if (groupCurrentX > startX + wrapWidth && framesInGroup.indexOf(spec) < framesInGroup.length - 1) {
              groupCurrentX = startX;
              groupCurrentY += groupRowMaxHeight + frameSpacingY;
              groupRowMaxHeight = 0;
              groupMaxYReached = Math.max(groupMaxYReached, groupCurrentY);
            }
          } catch (err) {
            console.error(`    \u274C Error creating frame "${spec.name}":`, err);
          }
        }
        overallCurrentY = groupMaxYReached + groupSpacingY;
        console.log(`  -- Group ${sizeKey} finished. Next group starts at Y=${overallCurrentY.toFixed(0)} --`);
      }
      console.log("\u2705 Frame creation from CSV complete (grouped).");
      figma.ui.postMessage({
        type: "csv-frames-created",
        message: `Created ${frameData.length} frames, grouped by size.`
      });
    });
  }
  function sendSelectionUpdate() {
    const selectedFrames = figma.currentPage.selection.filter(
      (node) => node.type === "FRAME"
    );
    const frameDetails = selectedFrames.map((frame) => ({
      name: frame.name,
      id: frame.id,
      width: frame.width,
      height: frame.height,
      x: frame.x,
      y: frame.y
    }));
    figma.ui.postMessage({
      type: "update-selection-details",
      frames: frameDetails
    });
  }
  var init_figma_helpers = __esm({
    "src/figma-helpers.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_figma_helpers();
      figma.showUI(__html__);
      figma.ui.resize(400, 600);
      figma.on("selectionchange", () => {
        sendSelectionUpdate();
      });
      sendSelectionUpdate();
      figma.ui.onmessage = (msg) => __async(exports, null, function* () {
        console.log("\u{1F4E9} Message received from UI:", msg);
        if (msg.type === "close") {
          console.log("\u{1F6D1} Closing plugin.");
          figma.closePlugin();
          return;
        }
        if (msg.type === "websocket-instructions") {
          const serverResponse = msg.data;
          const payload = serverResponse == null ? void 0 : serverResponse.instructions;
          if (payload && payload.type === "build-design" && payload.instructions) {
            console.log("\u2705 Received build-design payload via UI. Processing...");
            try {
              yield createDesign(payload);
              figma.notify("Design updated!", { timeout: 1500 });
            } catch (error) {
              console.error("\u274C Error processing build-design payload:", error);
              figma.notify("Error updating design.", { error: true });
            }
          } else {
            console.warn("\u26A0\uFE0F Invalid or empty payload received via websocket-instructions:", msg.data);
          }
        } else if (msg.type === "chat-message") {
          console.log("Received chat message:", msg.message);
          console.log("Received frame data:", msg.figmaFrame);
          const userMessage = msg.message;
          const frameData = msg.figmaFrame || [];
          const n8nWebhookUrl = "https://esme-mango.app.n8n.cloud/mcp-test/788ddf79-c150-4508-b967-07f7b61dc9aa/sse";
          figma.notify("Sending message to backend...", { timeout: 1e3 });
          try {
            console.log(`\u{1F680} Sending message and frame data to webhook: ${n8nWebhookUrl}`);
            const response = yield fetch(n8nWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: userMessage, figmaFrame: frameData })
            });
            console.log(`Webhook Response Status: ${response.status}`);
            if (!response.ok) {
              let errorDetails = "";
              try {
                errorDetails = yield response.text();
                console.error("Webhook Error Response Body:", errorDetails);
              } catch (parseError) {
              }
              throw new Error(`Webhook failed with status ${response.status}. ${errorDetails}`);
            }
            figma.notify("Message sent successfully.", { timeout: 1500 });
          } catch (error) {
            console.error("\u274C Error sending message to webhook:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            figma.notify(`Error sending message: ${errorMessage}`, { error: true });
          }
        } else if (msg.type === "create-frames") {
          console.log("Received create-frames message");
          if (msg.data && Array.isArray(msg.data) && msg.data.length > 0 && "name" in msg.data[0] && "width" in msg.data[0] && "height" in msg.data[0]) {
            try {
              yield createFramesFromSpecs(msg.data);
              figma.notify(`Created ${msg.data.length} frames.`, { timeout: 1500 });
            } catch (error) {
              console.error("\u274C Error executing createFramesFromSpecs:", error);
              const errorMessage = error instanceof Error ? error.message : "Unknown error creating frames";
              figma.notify(`Error creating frames: ${errorMessage}`, { error: true });
            }
          } else {
            console.error("\u274C Invalid data received for frame creation:", msg.data);
            figma.notify("Invalid data format received from CSV.", { error: true });
          }
        } else if (msg.type === "send-credentials-to-n8n") {
          const apiKey = msg.apiKey;
          const manualFileKeyInput = msg.manualFileKey;
          if (!apiKey) {
            console.error("\u274C API Key missing in message from UI.");
            figma.ui.postMessage({
              type: "credential-status",
              text: "Error: API Key was missing.",
              isError: true
            });
            return;
          }
          let fileKeyToSend = null;
          let fileNameToSend = "N/A";
          if (manualFileKeyInput) {
            console.log("\u2139\uFE0F Manual File Key/URL provided:", manualFileKeyInput);
            try {
              const url = new URL(manualFileKeyInput);
              const pathParts = url.pathname.split("/");
              const fileIndex = pathParts.indexOf("file");
              if (fileIndex !== -1 && fileIndex + 1 < pathParts.length) {
                fileKeyToSend = pathParts[fileIndex + 1];
                fileNameToSend = `Manually Entered (from URL)`;
                console.log(`Extracted File Key from URL: ${fileKeyToSend}`);
              } else {
                fileKeyToSend = manualFileKeyInput;
                fileNameToSend = "Manually Entered (as Key)";
                console.log(`Using provided input as File Key: ${fileKeyToSend}`);
              }
            } catch (e) {
              fileKeyToSend = manualFileKeyInput;
              fileNameToSend = "Manually Entered (as Key)";
              console.log(`Input is not a URL, using as File Key: ${fileKeyToSend}`);
            }
          } else {
            console.log("\u2139\uFE0F No manual file key provided, using current file.");
            const currentFileKey = figma.fileKey;
            if (currentFileKey) {
              fileKeyToSend = currentFileKey;
              fileNameToSend = figma.root.name;
            } else {
              fileKeyToSend = null;
              console.error("\u274C Could not get file key for the current Figma file.");
              figma.notify("Error: Could not identify the current Figma file.", { error: true });
              figma.ui.postMessage({
                type: "credential-status",
                text: "Error: Could not identify current Figma file.",
                isError: true
              });
              return;
            }
            console.log(`Using current file: ${fileNameToSend} (${fileKeyToSend})`);
          }
          const credentialsWebhookUrl = "https://your-n8n-instance.com/webhook/your-credentials-path";
          console.log(`\u{1F680} Sending API Key to credentials webhook: ${credentialsWebhookUrl}`);
          figma.notify("Sending credentials...", { timeout: 1e3 });
          try {
            const response = yield fetch(credentialsWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              // Send API key and the determined file info
              body: JSON.stringify({
                apiKey,
                fileKey: fileKeyToSend,
                fileName: fileNameToSend
              })
            });
            console.log(`Credentials Webhook Response Status: ${response.status}`);
            if (!response.ok) {
              let errorDetails = "";
              try {
                errorDetails = yield response.text();
                console.error("Credentials Webhook Error Body:", errorDetails);
              } catch (e) {
              }
              throw new Error(`Credentials webhook failed with status ${response.status}. ${errorDetails}`);
            }
            figma.ui.postMessage({
              type: "credential-status",
              text: "Credentials sent successfully!",
              isError: false
            });
            figma.notify("Credentials sent successfully.", { timeout: 1500 });
          } catch (error) {
            console.error("\u274C Error sending credentials to webhook:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            figma.ui.postMessage({
              type: "credential-status",
              text: `Error: ${errorMessage}`,
              isError: true
            });
            figma.notify(`Error sending credentials: ${errorMessage}`, { error: true });
          }
        } else {
          console.log("\u2753 Unknown message type received in code.ts:", msg.type);
        }
      });
    }
  });
  require_code();
})();
