# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crea el entrypoint directamente en el build (sin CRLF de Windows)
RUN printf '#!/bin/sh\nprintf "window.__SUPABASE_URL__=\\"%s\\";\\nwindow.__SUPABASE_ANON_KEY__=\\"%s\\";\\n" "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY" > /usr/share/nginx/html/env-config.js\nnginx -g "daemon off;"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
