import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Debug: Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(__dirname, 'dist', 'index.html');

console.log('=== DEBUG INFO ===');
console.log('Current directory:', __dirname);
console.log('Dist directory exists:', fs.existsSync(distPath));
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Dist directory contents:', fs.readdirSync(distPath));
console.log('==================');

// Serve static files from the dist directory
app.use(express.static(distPath, {
  index: false, // Don't serve index.html automatically
  setHeaders: (res, filePath) => {
    // Set proper headers for static assets
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Handle API routes (if any)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Handle React routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Log the request for debugging
  console.log(`Serving index.html for route: ${req.path}`);
  
  // Set proper headers for HTML
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache');
  
  // Serve index.html for all routes
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Successfully served index.html');
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`UrbanSprout server is running on port ${port}`);
  console.log(`Serving static files from: ${distPath}`);
  console.log(`React Router enabled - all routes will serve index.html`);
});