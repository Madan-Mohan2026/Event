import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const distPath = path.join(__dirname, 'dist');

// Serve static assets from the Vite build output
app.use(express.static(distPath));

// SPA fallback: serve index.html for all non-file routes
// This ensures client-side routing works for /events/:id, /register/:id, etc.
// Express v5 requires named wildcard params instead of bare '*'
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Landing page server running on port ${PORT}`);
});
