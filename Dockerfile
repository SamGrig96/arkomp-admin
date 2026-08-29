# Build ───────────────────────────────────────────────────────────────────────
# Vite inlines VITE_* values at build time, so the API and site URLs are build
# arguments rather than runtime environment variables.
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_API_URL=http://localhost:5080
ARG VITE_SITE_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

COPY . .
RUN npm run build

# Serve ───────────────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
