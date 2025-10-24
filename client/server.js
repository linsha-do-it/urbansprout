import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle API routes (if any)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Log the request for debugging
  console.log(`Serving index.html for route: ${req.path}`);
  
  // Serve index.html for all routes
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`UrbanSprout server is running on port ${port}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`React Router enabled - all routes will serve index.html`);
});