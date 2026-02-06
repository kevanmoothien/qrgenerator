const express = require('express');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route to generate QR code and return as PNG
app.get('/generate', async (req, res) => {
  const data = req.query.data || req.query.url || req.query.text;
  const width = parseInt(req.query.width) || 1000;
  const darkColor = req.query.darkColor || '#000000';
  const lightColor = req.query.lightColor || '#FFFFFF';
  const errorCorrectionLevel = req.query.errorCorrectionLevel || 'H';
  const margin = parseInt(req.query.margin) || 1;

  if (!data) {
    return res.status(400).json({ error: 'Please provide data, url, or text parameter' });
  }

  // Validate error correction level
  const validErrorLevels = ['L', 'M', 'Q', 'H'];
  if (!validErrorLevels.includes(errorCorrectionLevel)) {
    return res.status(400).json({ error: 'Invalid error correction level. Use L, M, Q, or H' });
  }

  // Validate width (minimum 1000px)
  const finalWidth = Math.max(width, 1000);

  // Validate colors
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!colorRegex.test(darkColor) || !colorRegex.test(lightColor)) {
    return res.status(400).json({ error: 'Invalid color format. Use hex colors (e.g., #000000)' });
  }

  try {
    // Generate QR code as PNG buffer (high resolution - 1000px minimum)
    const qrCodeBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: errorCorrectionLevel,
      type: 'png',
      quality: 0.92,
      margin: margin,
      color: {
        dark: darkColor,
        light: lightColor
      },
      width: finalWidth
    });

    // Set headers to return PNG image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="qrcode.png"');
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code: ' + error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ QR Code Generator server running on http://localhost:${PORT}`);
});
