const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const cors = require('cors');
const { createCanvas, loadImage } = require('canvas');

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Angular app
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Route to generate QR code and return as PNG
app.get('/api/generate', async (req, res) => {
  const data = req.query.data || req.query.url || req.query.text;
  const width = parseInt(req.query.width) || 1000;
  const darkColor = req.query.darkColor || '#000000';
  const lightColor = req.query.lightColor || '#FFFFFF';
  const errorCorrectionLevel = req.query.errorCorrectionLevel || 'H';
  const margin = parseInt(req.query.margin) || 1;
  const frameStyle = req.query.frameStyle || 'none';
  const pixelStyle = req.query.pixelStyle || 'square';
  const logo = req.query.logo; // base64 data URL
  const logoSize = parseInt(req.query.logoSize) || 20;

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

    // Load QR code image
    const qrImage = await loadImage(qrCodeBuffer);
    
    // Create canvas with padding for frame
    const framePadding = frameStyle !== 'none' ? 40 : 0;
    const canvas = createCanvas(finalWidth + framePadding * 2, finalWidth + framePadding * 2);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw frame if needed
    if (frameStyle !== 'none') {
      ctx.fillStyle = darkColor;
      const frameWidth = 8;
      const cornerRadius = frameStyle === 'rounded' ? 20 : frameStyle === 'circle' ? canvas.width / 2 : 0;
      
      if (frameStyle === 'circle') {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - frameWidth, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Draw frame border
        if (cornerRadius > 0) {
          roundRect(ctx, framePadding - frameWidth, framePadding - frameWidth, 
                    finalWidth + frameWidth * 2, finalWidth + frameWidth * 2, cornerRadius);
          ctx.fill();
          ctx.fillStyle = lightColor;
          roundRect(ctx, framePadding, framePadding, finalWidth, finalWidth, cornerRadius);
          ctx.fill();
        } else {
          ctx.fillRect(framePadding - frameWidth, framePadding - frameWidth, 
                      finalWidth + frameWidth * 2, finalWidth + frameWidth * 2);
          ctx.fillStyle = lightColor;
          ctx.fillRect(framePadding, framePadding, finalWidth, finalWidth);
        }
      }
    }

    // Apply pixel style processing
    if (pixelStyle === 'rounded' || pixelStyle === 'dots') {
      // Draw QR code to temporary canvas for processing
      const tempCanvas = createCanvas(finalWidth, finalWidth);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(qrImage, 0, 0, finalWidth, finalWidth);
      
      const imageData = tempCtx.getImageData(0, 0, finalWidth, finalWidth);
      const data = imageData.data;
      
      // Create styled canvas
      const styledCanvas = createCanvas(finalWidth, finalWidth);
      const styledCtx = styledCanvas.getContext('2d');
      styledCtx.fillStyle = lightColor;
      styledCtx.fillRect(0, 0, finalWidth, finalWidth);
      styledCtx.fillStyle = darkColor;
      
      // Detect module size by finding pattern
      // Sample a few rows to estimate module size
      let moduleSize = 20;
      for (let testY = 10; testY < 50; testY++) {
        let transitions = 0;
        let lastColor = data[(testY * finalWidth) * 4] < 128;
        for (let x = 1; x < finalWidth; x++) {
          const idx = (testY * finalWidth + x) * 4;
          const isDark = data[idx] < 128;
          if (isDark !== lastColor) {
            transitions++;
            lastColor = isDark;
          }
        }
        if (transitions > 10) {
          moduleSize = Math.floor(finalWidth / (transitions / 2));
          break;
        }
      }
      
      // Ensure reasonable module size
      moduleSize = Math.max(8, Math.min(moduleSize, 50));
      const step = moduleSize;
      const radius = pixelStyle === 'rounded' ? moduleSize * 0.25 : (pixelStyle === 'dots' ? moduleSize * 0.4 : 0);
      
      // Process and redraw with style
      for (let y = 0; y < finalWidth; y += step) {
        for (let x = 0; x < finalWidth; x += step) {
          // Sample multiple points in the module to determine if it's mostly dark
          let darkPixels = 0;
          let totalSamples = 0;
          const sampleStep = Math.max(1, Math.floor(step / 3));
          
          for (let sy = y; sy < Math.min(y + step, finalWidth); sy += sampleStep) {
            for (let sx = x; sx < Math.min(x + step, finalWidth); sx += sampleStep) {
              const idx = (sy * finalWidth + sx) * 4;
              if (data[idx] < 200) darkPixels++;
              totalSamples++;
            }
          }
          
          // If more than 30% dark, consider it a dark module
          if (darkPixels / totalSamples > 0.3) {
            const centerX = x + step / 2;
            const centerY = y + step / 2;
            
            if (pixelStyle === 'dots') {
              styledCtx.beginPath();
              styledCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              styledCtx.fill();
            } else if (pixelStyle === 'rounded') {
              const size = step * 0.85;
              roundRect(styledCtx, centerX - size/2, centerY - size/2, size, size, radius);
              styledCtx.fill();
            }
          }
        }
      }
      
      // Draw styled QR code to main canvas
      ctx.drawImage(styledCanvas, framePadding, framePadding, finalWidth, finalWidth);
    } else {
      // Draw original QR code for square style
      ctx.drawImage(qrImage, framePadding, framePadding, finalWidth, finalWidth);
    }

    // Add logo if provided
    if (logo) {
      try {
        const logoImg = await loadImage(logo);
        const logoDimension = (finalWidth * logoSize) / 100;
        const logoX = framePadding + (finalWidth - logoDimension) / 2;
        const logoY = framePadding + (finalWidth - logoDimension) / 2;
        
        // Draw white background for logo
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(framePadding + finalWidth / 2, framePadding + finalWidth / 2, 
                logoDimension / 2 + 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoDimension, logoDimension);
      } catch (logoError) {
        console.error('Error loading logo:', logoError);
        // Continue without logo if it fails to load
      }
    }

    // Convert canvas to buffer
    const finalBuffer = canvas.toBuffer('image/png');

    // Set headers to return PNG image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="qrcode.png"');
    res.send(finalBuffer);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code: ' + error.message });
  }
});

// Serve Angular app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Development mode - provide helpful message
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Generator API</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 { color: #333; }
            .info { 
              background: #e3f2fd;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
            }
            code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
            }
            a {
              color: #1976d2;
              text-decoration: none;
            }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔲 QR Code Generator API</h1>
            <div class="info">
              <p><strong>Development Mode</strong></p>
              <p>This is the API server. The Angular frontend is running on:</p>
              <p><a href="http://localhost:4300" target="_blank">http://localhost:4300</a></p>
            </div>
            <h2>API Endpoint</h2>
            <p>Generate QR codes via:</p>
            <code>GET /api/generate?data=YOUR_DATA</code>
            <h3>Example:</h3>
            <p><a href="/api/generate?data=https://example.com&width=1000" target="_blank">/api/generate?data=https://example.com&width=1000</a></p>
          </div>
        </body>
      </html>
    `);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`✓ QR Code Generator API server running on http://localhost:${PORT}`);
  console.log(`✓ API endpoint: http://localhost:${PORT}/api/generate`);
});
