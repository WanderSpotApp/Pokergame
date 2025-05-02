#!/bin/bash

set -e  # Exit on error

# Install dependencies for the main project
echo "Installing main project dependencies..."
npm install

# Install dependencies for the frontend
echo "Installing frontend dependencies..."
cd poker-frontend
npm install

# Build the frontend
echo "Building frontend..."
CI=false npm run build
cd ..

echo "Build completed successfully!" 