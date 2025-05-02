# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy all files first
COPY . .

# Install dependencies
RUN npm install
RUN cd poker-frontend && npm install

# Build frontend
RUN cd poker-frontend && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/poker-frontend/build ./poker-frontend/build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose port
EXPOSE 10000

# Start the application
CMD ["node", "src/server-new.js"] 