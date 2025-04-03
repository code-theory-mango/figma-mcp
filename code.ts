figma.showUI(__html__);
figma.ui.resize(400, 600);

// 🔁 Polling for instructions from server
setInterval(async () => {
  try {
    const res = await fetch('https://fda1-38-74-197-217.ngrok-free.app/get-instructions');
    const { instructions } = await res.json() as { instructions: any };

    if (instructions) {
      console.log("📦 Received instructions from server:", instructions);
      await handleBuildInstructions(instructions);
    }
  } catch (err) {
    console.log('⚠️ No instructions found or polling failed.', err);
  }
}, 3000); // Poll every 3 seconds

// 📦 Shared build logic for plugin + polling
async function handleBuildInstructions(instructions: any) {
  const blocks = Array.isArray(instructions) ? instructions : [instructions];

  for (const block of blocks) {
    if (block.name === 'typography' && block.type === 'json') {
      const content = block.content as Record<string, { componentKey: string, position: any }>;

      for (const [role, { componentKey, position }] of Object.entries(content)) {
        try {
          const component = await figma.importComponentByKeyAsync(componentKey);
          const instance = component.createInstance();
          figma.currentPage.appendChild(instance);

          // 🔧 Simple vertical stacking for now — can be upgraded to position logic
          instance.x = 100;
          instance.y = 100 + Object.keys(content).indexOf(role) * 200;

        } catch (err) {
          console.error(`❌ Error importing ${role} from ${componentKey}:`, err);
        }
      }
    }

    // 💡 You can expand for layout, color, etc.
    // else if (block.name === 'layout') { ... }
  }

  figma.ui.postMessage({
    type: 'design-built',
    message: '✅ Design placed on canvas.'
  });
}

// 💬 Handle UI messages (e.g. chat input)
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'chat-message') {
    const userMessage = msg.message;

    try {
      const response = await fetch('https://candt.app.n8n.cloud/webhook/6b4b51bb-bb8a-4207-b57e-1cbc27eb583c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json() as { response?: string };

      figma.ui.postMessage({
        type: 'chat-response',
        message: data.response || 'Message sent successfully!'
      });
    } catch (error) {
      console.error('❌ Chat error:', error);
      figma.ui.postMessage({
        type: 'chat-response',
        message: 'Sorry, there was an error processing your request.'
      });
    }
  }

  // 🧠 Also handle manual design instructions (optional)
  if (msg.type === 'build-design' && msg.instructions) {
    await handleBuildInstructions(msg.instructions);
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
