// Simple development server for local testing only
// This is NOT used on Netlify - only for local development

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log('📍 This is for LOCAL DEVELOPMENT ONLY');
  console.log('🌐 Your LIVE site is on Netlify at: https://getsmartyai.space');
});