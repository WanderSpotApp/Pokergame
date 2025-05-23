# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install Git
RUN apk add --no-cache git

# Copy all files from main repository
COPY . .

# Install root dependencies
RUN npm install

# Remove existing poker-frontend directory if it exists
RUN rm -rf poker-frontend

# Clone frontend repository
RUN git clone https://github.com/WanderSpotApp/poker-frontend.git

# Install frontend dependencies
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
COPY --from=build /app/poker-frontend/build ./src/poker-frontend/build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV REACT_APP_API_URL=https://pokergame-2.onrender.com

# Expose port
EXPOSE 10000

# Start the application
CMD ["node", "src/server-new.js"] 