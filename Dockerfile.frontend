# Stage 1: Build React Vite Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Pass build-time environment variable for backend API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy application source code
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Serve React Static Production Build with Nginx
FROM nginx:alpine

# Copy built assets to Nginx default html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx SPA routing configuration if needed
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
