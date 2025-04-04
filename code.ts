figma.showUI(__html__);
figma.ui.resize(400, 600);

// Simple test fetch
const testServer = async () => {
  try {
    console.log('Testing server connection...');
    const res = await fetch('https://167f-38-74-197-217.ngrok-free.app/test');
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Raw response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
};

// Test immediately and every 3 seconds
testServer();
setInterval(testServer, 3000);

// 💬 Handle UI messages
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
