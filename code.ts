// Helper function to convert hex colors to RGB values between 0-1
function hexToRgb(hex: string) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255
  };
}

// Define instruction types
type TypographyStyle = {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  fill: string;
};

type TextContent = {
  type: 'text';
  content: string;
  position: string;
  style: TypographyStyle;
};

type TypographyContent = {
  headline?: TextContent;
  body?: TextContent;
  caption?: TextContent;
};

interface DesignInstruction {
  name: string;
  type: string;
  content: any;
}

interface DesignData {
  instructions: {
    type: string;
    instructions: DesignInstruction[];
  }
}

// Track vertical position for stacking frames
let lastY = 0;

// Helper function to create a new main container
function createMainContainer(layout: any) {
  const main = figma.createFrame();
  main.name = `Main Content ${new Date().toISOString()}`;
  main.resize(800, 400);
  main.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  main.x = 100;
  main.y = lastY + 50; // Add spacing from the previous one
  lastY = main.y + 400; // Update baseline for next container

  figma.currentPage.appendChild(main);
  console.log(`✅ Created new main container at y=${main.y}`);
  return main;
}

figma.showUI(__html__);
figma.ui.resize(400, 600);

// Helper function to get the correct font style based on weight
function getFontStyle(weight: string): string {
  switch (weight.toLowerCase()) {
    case 'bold':
      return 'Bold';
    case 'italic':
      return 'Italic';
    case 'regular':
    default:
      return 'Regular';
  }
}

async function createDesign(instructions: DesignInstruction[]) {
  console.log('🎨 Creating design from instructions:', instructions);
  
  // Create the main container first
  const container = figma.createFrame();
  container.name = 'Design Container';
  container.resize(800, 400);
  container.x = 100;
  container.y = 100;
  container.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  figma.currentPage.appendChild(container);

  // Process each instruction
  for (const instruction of instructions) {
    console.log(`Processing instruction: ${instruction.name}`, instruction);

    if (instruction.name === 'typography') {
      const content = instruction.content;
      console.log('Typography content:', content);
      
      // Create headline
      if (content.headline) {
        console.log('Creating headline:', content.headline);
        try {
          const fontFamily = content.headline.style.fontFamily || 'Inter';
          const fontStyle = getFontStyle(content.headline.style.fontWeight);
          console.log(`Loading font: ${fontFamily} ${fontStyle}`);
          await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
          
          const text = figma.createText();
          text.fontName = { family: fontFamily, style: fontStyle };
          text.fontSize = content.headline.style.fontSize;
          text.fills = [{ type: 'SOLID', color: hexToRgb(content.headline.style.fill) }];
          text.characters = content.headline.content;
          
          // Position based on position property
          if (content.headline.position === 'top-center') {
            text.x = (container.width - text.width) / 2;
            text.y = 40;
          }
          
          container.appendChild(text);
        } catch (err) {
          console.error('Error creating headline:', err);
        }
      }

      // Create body
      if (content.body) {
        console.log('Creating body:', content.body);
        try {
          const fontFamily = content.body.style.fontFamily || 'Inter';
          const fontStyle = getFontStyle(content.body.style.fontWeight);
          console.log(`Loading font: ${fontFamily} ${fontStyle}`);
          await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
          
          const text = figma.createText();
          text.fontName = { family: fontFamily, style: fontStyle };
          text.fontSize = content.body.style.fontSize;
          text.fills = [{ type: 'SOLID', color: hexToRgb(content.body.style.fill) }];
          text.characters = content.body.content;
          
          // Position based on position property
          if (content.body.position === 'center') {
            text.x = (container.width - text.width) / 2;
            text.y = (container.height - text.height) / 2;
          }
          
          container.appendChild(text);
        } catch (err) {
          console.error('Error creating body:', err);
        }
      }

      // Create caption
      if (content.caption) {
        console.log('Creating caption:', content.caption);
        try {
          const fontFamily = content.caption.style.fontFamily || 'Inter';
          const fontStyle = getFontStyle(content.caption.style.fontWeight);
          console.log(`Loading font: ${fontFamily} ${fontStyle}`);
          await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
          
          const text = figma.createText();
          text.fontName = { family: fontFamily, style: fontStyle };
          text.fontSize = content.caption.style.fontSize;
          text.fills = [{ type: 'SOLID', color: hexToRgb(content.caption.style.fill) }];
          text.characters = content.caption.content;
          
          // Position based on position property
          if (content.caption.position === 'bottom-left') {
            text.x = 40;
            text.y = container.height - text.height - 40;
          }
          
          container.appendChild(text);
        } catch (err) {
          console.error('Error creating caption:', err);
        }
      }
    }

    if (instruction.name === 'layout' && instruction.content.backgroundColor) {
      container.fills = [{ type: 'SOLID', color: hexToRgb(instruction.content.backgroundColor) }];
    }
  }
}

// Poll for instructions
async function pollForInstructions() {
  try {
    const res = await fetch('https://ade6-38-74-197-217.ngrok-free.app/get-instructions', {
      headers: { 'ngrok-skip-browser-warning': '1' }
    });
    
    const data = await res.json() as DesignData;
    console.log('📥 Received data:', data);

    if (data?.instructions?.type === 'build-design' && data.instructions.instructions) {
      await createDesign(data.instructions.instructions);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

// Start polling
pollForInstructions();
setInterval(pollForInstructions, 8000);

// Handle UI messages
figma.ui.onmessage = msg => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
