#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Build client
cd client-new
npm install
npm run build
cd ..
