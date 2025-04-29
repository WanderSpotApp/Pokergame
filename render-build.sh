#!/bin/bash

# Install dependencies for the main project
echo "Installing main project dependencies..."
npm install

# Install dependencies for the frontend
echo "Installing frontend dependencies..."
cd poker-frontend
npm install

# Build the frontend
echo "Building frontend..."
npm run build
cd ..

echo "Build completed successfully!" 