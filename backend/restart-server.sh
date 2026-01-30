#!/bin/bash

echo "Stopping any running NestJS servers..."
# On Windows Git Bash, use taskkill
taskkill //F //IM node.exe 2>/dev/null || echo "No node processes to kill"

echo "Building the project..."
npm run build

echo "Starting the server..."
npm run start:dev
