# Base image
FROM node:16-alpine AS base
WORKDIR /app
# Build dependencies - collects all dependencies (including dev) as all they are needed to build the app
FROM base as bdependencies
# Copy package.json and package-lock.json files and install build dependencies
COPY package*.json ./
RUN npm install
# Build image
FROM bdependencies AS build
WORKDIR /app
COPY src ./src
COPY tsconfig.build.json ./
COPY tsconfig.json ./
RUN npm run build

# Run dependencies - collects only production-needed dependencies which Nest (Node) requires to run the app
# Note: Moved to separate stage to avoid installing "npm" in Final image to reduce it's result size
FROM alpine AS rdependencies
WORKDIR /app
# Copy package.json and package-lock.json files and install prod run dependencies
RUN apk add --no-cache npm
COPY package*.json ./
RUN npm install --omit=dev

# Final image
FROM alpine AS release
WORKDIR /app
RUN apk add --no-cache nodejs
COPY --from=rdependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4000
ENTRYPOINT ["node", "dist/main.js"]
