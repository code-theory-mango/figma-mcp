figma.showUI(__html__);
figma.ui.resize(400, 600);

// Poll for instructions from server
const pollForInstructions = async () => {
  try {
    console.log('🔄 Polling for instructions...');
    const url = 'https://fdd3-38-74-197-217.ngrok-free.app/get-instructions';
    console.log('📡 Fetching from:', url);
    
    const res = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': '1'
      }
    });
    
    console.log('📥 Response status:', res.status);
    
    const text = await res.text();
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
      const content = data.instructions.content as Record<string, { nodeId: string, position: any }>;
      console.log('🎨 Processing typography instructions:', content);
      
      for (const [role, { nodeId, position }] of Object.entries(content)) {
        try {
          console.log(`🔍 Importing component for ${role} with ID ${nodeId}`);
          const component = await figma.importComponentByKeyAsync(nodeId);
          const instance = component.createInstance();
          figma.currentPage.appendChild(instance);
          
          instance.x = 100;
          instance.y = 100 + Object.keys(content).indexOf(role) * 200;
          console.log(`✅ Placed ${role} component at x:${instance.x}, y:${instance.y}`);
        } catch (err) {
          console.error(`❌ Error importing ${role} from ${nodeId}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
};

// Poll immediately and every 5 seconds
pollForInstructions();
setInterval(pollForInstructions, 5000);

// Handle UI messages
figma.ui.onmessage = msg => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
