# Build stage for Angular app
FROM node:20-alpine AS angular-builder

WORKDIR /app

# Copy Angular app files (maintaining directory structure)
COPY angular-app/ ./angular-app/

# Install Angular dependencies
RUN cd angular-app && npm ci

# Build Angular app for production
# Outputs to ../dist (relative to angular-app), which becomes /app/dist
RUN cd angular-app && npm run build -- --configuration production --output-path=../dist

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for canvas (required for QR code image manipulation)
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server file
COPY server.js ./

# Copy built Angular app from builder stage
# The build outputs to /app/dist in the builder stage
COPY --from=angular-builder /app/dist ./dist

# Expose port (Coolify will map this)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/generate?data=test', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server.js"]
