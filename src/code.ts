// Import functions from modules
import { 
    createDesign, 
    createFramesFromSpecs, 
    sendSelectionUpdate,
    FrameSpec,
    ServerPayload // Import types needed by message handler
} from './figma-helpers';
// Note: getFontStyle is likely only used within figma-helpers now, so no need to import it here unless used elsewhere.

// --- TYPE DEFINITIONS (Keep only those needed by this file, e.g., for message structure) ---
// This might be empty or just contain specific message types if not defined elsewhere.

// Example: Define message structure if needed for clarity
interface UIMessage {
  type: string;
  payload?: any; // Generic payload, adjust as needed
  data?: any; // For CSV data
  message?: string; // For chat messages
  figmaFrame?: any; // For frame data with chat
}

// Define ServerWrapper if needed specifically for the websocket message handler
interface ServerWrapper {
  instructions: ServerPayload | null;
}

// --- TYPE DEFINITIONS ---

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle?: string;
  color?: { r: number; g: number; b: number; a?: number };
}

interface Placement {
  x: number;
  y: number;
}

interface TextNodeInstruction {
  name: string;
  characters: string;
  style: TextStyle;
  placement: Placement;
}

interface FrameStyle {
  name: string;
  width: number;
  height: number;
}

interface LogoInstruction {
  name: string;
  componentKey: string;
  placement: Placement;
  dimensions: { width: number; height: number; };
  alignment?: string;
}

interface TypographyContent {
  textNodes: TextNodeInstruction[];
  frame: FrameStyle;
  logos?: LogoInstruction[];
}

interface Instruction {
  name: 'typography' | string;
  type: 'json' | string;
  content: TypographyContent | any;
}

// --- INIT UI ---
figma.showUI(__html__);
figma.ui.resize(400, 600);

// --- HELPERS (All moved to modules) ---
// <<< Removed getFontStyle >>>
// <<< Removed clearPreviousDesigns >>>

// --- MAIN DESIGN CREATION FUNCTIONS (Moved to modules) ---
// <<< Removed createDesign >>>
// <<< Removed createFramesFromSpecs >>>

// --- Selection Handling (Function moved, listener remains) ---
// <<< Removed sendSelectionUpdate function body >>>

// Listen for selection changes in Figma and call the imported helper
figma.on('selectionchange', () => {
  sendSelectionUpdate();
});

// --- Initial Setup ---

// Send initial selection state when plugin loads
sendSelectionUpdate();

// --- MESSAGE HANDLING (Main logic stays here, delegates to imported functions) ---

figma.ui.onmessage = async (msg: UIMessage | any) => { // Add basic type to msg
  console.log("📩 Message received from UI:", msg);

  // --- Standard Handlers ---
  if (msg.type === 'close') {
    console.log('🛑 Closing plugin.');
    figma.closePlugin();
    return; // Exit early
  }

  // --- Specific Functionality Handlers ---

  // Handle instructions likely from a WebSocket message forwarded by UI
  if (msg.type === 'websocket-instructions') {
    const serverResponse = msg.data as ServerWrapper; // Assuming msg.data contains the wrapper
    const payload = serverResponse?.instructions; // Use optional chaining

    if (payload && payload.type === 'build-design' && payload.instructions) {
      console.log('✅ Received build-design payload via UI. Processing...');
      try {
        await createDesign(payload);
        figma.notify('Design updated!', { timeout: 1500 });
        // figma.ui.postMessage({ type: 'status', message: 'Design updated via WebSocket!' }); // Optional status back to UI
      } catch (error) {
        console.error('❌ Error processing build-design payload:', error);
        figma.notify('Error updating design.', { error: true });
      }
    } else {
      console.warn('⚠️ Invalid or empty payload received via websocket-instructions:', msg.data);
    }
  }
  // Handle chat messages to be sent to n8n (or other backend)
  else if (msg.type === 'chat-message') {
    console.log("Received chat message:", msg.message);
    console.log("Received frame data:", msg.figmaFrame);

    const userMessage = msg.message;
    const frameData = msg.figmaFrame || [];
    // TODO: Replace with your actual webhook URL or make it configurable
    const n8nWebhookUrl = 'https://your-n8n-instance.com/webhook/your-path'; 

    figma.notify('Sending message to backend...', { timeout: 1000 });
    // figma.ui.postMessage({ type: 'status', message: 'Sending message and frame data to n8n...' });

    try {
      console.log(`🚀 Sending message and frame data to webhook: ${n8nWebhookUrl}`);
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, figmaFrame: frameData })
      });

      console.log(`Webhook Response Status: ${response.status}`);

      if (!response.ok) {
        let errorDetails = '';
        try {
           errorDetails = await response.text();
           console.error("Webhook Error Response Body:", errorDetails);
        } catch (parseError) { /* Ignore */ }
        throw new Error(`Webhook failed with status ${response.status}. ${errorDetails}`);
      }

      figma.notify('Message sent successfully.', { timeout: 1500 });
      // figma.ui.postMessage({ type: 'chat-response', message: 'Message sent successfully.' });

    } catch (error) {
      console.error('❌ Error sending message to webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      figma.notify(`Error sending message: ${errorMessage}`, { error: true });
      // figma.ui.postMessage({ type: 'chat-response', message: `Error sending message: ${errorMessage}` });
    }
  }
  // Handle CSV frame creation request from UI
  else if (msg.type === 'create-frames') { // Expecting 'create-frames' from UI
    console.log('Received create-frames message');
    // Validate data structure (basic)
    if (msg.data && Array.isArray(msg.data) && msg.data.length > 0 && 'name' in msg.data[0] && 'width' in msg.data[0] && 'height' in msg.data[0]) {
      try {
          // Type assertion for safety, assuming UI sends correct structure based on FrameSpec
          await createFramesFromSpecs(msg.data as FrameSpec[]);
          figma.notify(`Created ${msg.data.length} frames.`, { timeout: 1500 });
          // figma.ui.postMessage({ type: 'creation-complete' }); // Notify UI if needed
      } catch (error) {
          console.error('❌ Error executing createFramesFromSpecs:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error creating frames';
          figma.notify(`Error creating frames: ${errorMessage}`, { error: true });
          // figma.ui.postMessage({ type: 'creation-error', message: errorMessage }); // Notify UI of error
      }
    } else {
        console.error('❌ Invalid data received for frame creation:', msg.data);
        figma.notify('Invalid data format received from CSV.', { error: true });
    }
  } 
  // <<< NEW: Handle sending credentials to n8n >>>
  else if (msg.type === 'send-credentials-to-n8n') {
    const apiKey = msg.apiKey;
    const manualFileKeyInput = msg.manualFileKey; // Input from UI (could be key or URL)

    if (!apiKey) {
      console.error('❌ API Key missing in message from UI.');
      figma.ui.postMessage({ 
          type: 'credential-status', 
          text: 'Error: API Key was missing.',
          isError: true 
        });
      return;
    }

    let fileKeyToSend: string | null = null;
    let fileNameToSend: string | null = 'N/A';

    // Check if a manual file key/URL was provided
    if (manualFileKeyInput) {
      console.log('ℹ️ Manual File Key/URL provided:', manualFileKeyInput);
      // Attempt to extract file key if it looks like a URL
      try {
        const url = new URL(manualFileKeyInput);
        const pathParts = url.pathname.split('/');
        const fileIndex = pathParts.indexOf('file');
        if (fileIndex !== -1 && fileIndex + 1 < pathParts.length) {
          fileKeyToSend = pathParts[fileIndex + 1];
          fileNameToSend = `Manually Entered (from URL)`;
          console.log(`Extracted File Key from URL: ${fileKeyToSend}`);
        } else {
          // Assume the input *was* the key itself if URL parsing fails to find it
          fileKeyToSend = manualFileKeyInput; 
          fileNameToSend = 'Manually Entered (as Key)';
          console.log(`Using provided input as File Key: ${fileKeyToSend}`);
        }
      } catch (e) {
        // If it's not a valid URL, assume the input was the key itself
        fileKeyToSend = manualFileKeyInput; 
        fileNameToSend = 'Manually Entered (as Key)';
        console.log(`Input is not a URL, using as File Key: ${fileKeyToSend}`);
      }
    } else {
      console.log('ℹ️ No manual file key provided, using current file.');
      // Use the currently open Figma file
      const currentFileKey = figma.fileKey; // Assign to temp variable
      if (currentFileKey) { // Check if it's defined
          fileKeyToSend = currentFileKey;
          fileNameToSend = figma.root.name;
      } else {
        // Handle case where fileKey is undefined
        fileKeyToSend = null; // Explicitly set to null
        console.error('❌ Could not get file key for the current Figma file.');
        figma.notify('Error: Could not identify the current Figma file.', { error: true });
         figma.ui.postMessage({ 
            type: 'credential-status', 
            text: 'Error: Could not identify current Figma file.',
            isError: true 
          });
        return; // Stop if we can't get the current file key
      }
      console.log(`Using current file: ${fileNameToSend} (${fileKeyToSend})`);
    }

    // TODO: Replace with your actual webhook URL for credentials
    const credentialsWebhookUrl = 'https://your-n8n-instance.com/webhook/your-credentials-path'; 
    console.log(`🚀 Sending API Key to credentials webhook: ${credentialsWebhookUrl}`);
    figma.notify('Sending credentials...', { timeout: 1000 });

    try {
      const response = await fetch(credentialsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send API key and the determined file info
        body: JSON.stringify({ 
            apiKey: apiKey, 
            fileKey: fileKeyToSend,
            fileName: fileNameToSend 
        })
      });

      console.log(`Credentials Webhook Response Status: ${response.status}`);

      if (!response.ok) {
        let errorDetails = '';
        try { 
          errorDetails = await response.text(); 
          console.error("Credentials Webhook Error Body:", errorDetails);
        } catch { /* Ignore */ }
        throw new Error(`Credentials webhook failed with status ${response.status}. ${errorDetails}`);
      }

      // Send success feedback to UI
      figma.ui.postMessage({ 
          type: 'credential-status', 
          text: 'Credentials sent successfully!',
          isError: false
        });
      figma.notify('Credentials sent successfully.', { timeout: 1500 });

    } catch (error) {
      console.error('❌ Error sending credentials to webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      // Send error feedback to UI
      figma.ui.postMessage({ 
          type: 'credential-status', 
          text: `Error: ${errorMessage}`,
          isError: true 
        });
      figma.notify(`Error sending credentials: ${errorMessage}`, { error: true });
    }
  }
  // --- Ignore messages originating from code.ts ---
  // else if (msg.type === 'update-selection-details') {
  //   // No action needed here, message originates from code.ts
  // }
  else {
    console.log("❓ Unknown message type received in code.ts:", msg.type);
  }
};
