import express from 'express';

const app = express();
app.use(express.json());

let latestInstructions: any = null;

app.post('/figma-webhook', (req, res) => {
  latestInstructions = req.body.instructions;
  console.log('✅ Received instructions via webhook');
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('🚀 Figma plugin server listening on http://localhost:3000');
});

app.get('/get-instructions', (req, res) => {
    res.json({ instructions: latestInstructions });
  });
  