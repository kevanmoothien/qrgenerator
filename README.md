# Easy QR Code Generator - Angular Edition

A comprehensive web application built with Angular frontend and Node.js/Express backend that generates high-resolution QR codes for various content types with extensive customization options.

## Features

- **Angular Framework**: Modern, reactive frontend with live reload
- **Multiple Content Types:**
  - URLs/Websites
  - Plain Text
  - Email (with subject and body)
  - Phone Numbers
  - WiFi Network Credentials

- **Customization Options:**
  - High-resolution output (1000px minimum, customizable)
  - Color customization (foreground and background)
  - Error correction levels (L, M, Q, H)
  - Adjustable margins
  - PNG format output

- **Live Reload**: Automatic browser refresh on code changes
- **User-Friendly Interface:**
  - Tab-based interface for different content types
  - Real-time preview
  - Download functionality
  - Input validation and error handling
  - Responsive design

## Installation

### Install all dependencies:

```bash
yarn install-all
```

Or manually:

```bash
# Install backend dependencies
yarn install

# Install Angular dependencies
cd angular-app
yarn install
cd ..
```

## Development

### Start both servers with live reload:

```bash
yarn dev
```

This will start:
- **Backend API server** on `http://localhost:3000` (with nodemon for auto-restart)
- **Angular dev server** on `http://localhost:4300` (with live reload)

### Or start them separately:

**Backend only:**
```bash
yarn server
```

**Angular frontend only:**
```bash
yarn client
```

## Production Build

Build the Angular app for production:

```bash
yarn build
```

Then start the production server:

```bash
yarn start
```

The server will serve the built Angular app from the `dist` directory.

## Project Structure

```
qr-generator/
├── angular-app/          # Angular frontend application
│   ├── src/
│   │   ├── app/          # Angular components
│   │   └── ...
│   └── package.json
├── server.js             # Express backend API server
├── package.json          # Root package.json with scripts
└── README.md
```

## API Endpoint

The backend API is available at:

```
GET http://localhost:3000/api/generate?data=<CONTENT>&width=<SIZE>&darkColor=<COLOR>&lightColor=<COLOR>&errorCorrectionLevel=<LEVEL>&margin=<MARGIN>
```

### Parameters:
- `data` (required): The content to encode in the QR code
- `url` or `text` (alternative): Can be used instead of `data`
- `width` (optional): Image width in pixels (default: 1000, minimum: 1000)
- `darkColor` (optional): Foreground color in hex format (default: #000000)
- `lightColor` (optional): Background color in hex format (default: #FFFFFF)
- `errorCorrectionLevel` (optional): Error correction level - L, M, Q, or H (default: H)
- `margin` (optional): Margin size (default: 1)

## Content Type Formats

- **URL**: Direct website URLs (e.g., `https://example.com`)
- **Text**: Any plain text content
- **Email**: Automatically formatted as `mailto:` links with optional subject and body
- **Phone**: Automatically formatted as `tel:` links
- **WiFi**: Formatted according to WiFi QR code standard (WIFI:T:WPA;S:SSID;P:password;;)

## Technology Stack

- **Angular 17** - Frontend framework
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **qrcode** - QR code generation library
- **Nodemon** - Auto-restart backend on changes
- **Concurrently** - Run multiple commands simultaneously

## Live Reload

- **Angular**: Live reload is enabled by default when running `ng serve` (via `yarn client`)
- **Backend**: Auto-restart is enabled via nodemon when running `yarn server`
- **Both**: Use `yarn dev` to run both with live reload/auto-restart

## Author

**Kevan**

GitHub: [https://github.com/kevanmoothien/qrgenerator](https://github.com/kevanmoothien/qrgenerator)

## License

MIT License - see [LICENSE](LICENSE) file for details.
