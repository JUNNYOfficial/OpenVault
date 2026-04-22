/**
 * Dockerfile Template
 * Looks like a legitimate container configuration for a Node.js app.
 */

module.exports = {
  header: `# Dockerfile
# Multi-stage build for Node.js application
# Optimized for production deployment

`,
  sections: [
    `# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

`,
    `# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

`,
    `# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

`,
    `# Start the application
CMD ["node", "dist/server.js"]

# Build command:
# docker build -t myapp:latest .
# docker run -p 3000:3000 myapp:latest
`
  ],
  footer: `\n# End of Dockerfile\n`,
  slots: 4
};
