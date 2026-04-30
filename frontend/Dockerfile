# # Build stage
# FROM node:20-alpine AS builder

# WORKDIR /app

# # Accept build arguments
# ARG VITE_API_BASE_URL
# ARG VITE_SOCKET_URL
# ARG VITE_AI_SERVICE_URL
# ARG VITE_MAPBOX_TOKEN

# # Set environment variables for build
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
# ENV VITE_AI_SERVICE_URL=$VITE_AI_SERVICE_URL
# ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci

# # Copy source code
# COPY . .

# # Build the application
# RUN npm run build

# # Production stage
# FROM nginx:alpine

# # Copy built assets from builder stage
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Copy nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Expose port 80
# EXPOSE 80

# # Start nginx
# CMD ["nginx", "-g", "daemon off;"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ARG VITE_AI_SERVICE_URL
ARG VITE_MAPBOX_TOKEN
ARG VITE_TRACKING_SERVICE_URL

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_AI_SERVICE_URL=$VITE_AI_SERVICE_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_TRACKING_SERVICE_URL=$VITE_TRACKING_SERVICE_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]