#!/bin/bash

echo "🧹 Cleaning up build artifacts..."

# Stop any running processes on port 3000
echo "Stopping processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Remove build artifacts
echo "Removing .next directory..."
rm -rf .next

# Remove node_modules and reinstall (optional - uncomment if needed)
# echo "Removing node_modules..."
# rm -rf node_modules
# echo "Reinstalling dependencies..."
# npm install

echo "✅ Cleanup complete!"
echo "Now run: npm run dev"
