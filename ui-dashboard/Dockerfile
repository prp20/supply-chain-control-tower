# ============================================
# Stage 1: Build React Application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the production application
RUN npm run build

# Verify build output exists
RUN test -d dist || (echo "Build failed - dist directory not found" && exit 1)

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx cache and log directories
RUN mkdir -p /var/cache/nginx /var/log/nginx && \
    chmod 755 /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Health check endpoint
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Expose HTTP port
EXPOSE 80

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
