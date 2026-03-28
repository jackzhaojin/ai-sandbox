#!/bin/bash

echo "🔍 Verifying Notion API POC Setup..."
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node --version

# Check npm version
echo "✓ Checking npm version..."
npm --version

# Check if dependencies are installed
echo "✓ Checking dependencies..."
if [ -d "node_modules/@notionhq" ]; then
    echo "  ✓ @notionhq/client installed"
else
    echo "  ✗ @notionhq/client NOT installed"
    exit 1
fi

if [ -d "node_modules/dotenv" ]; then
    echo "  ✓ dotenv installed"
else
    echo "  ✗ dotenv NOT installed"
    exit 1
fi

# Check if .env exists and has API key
echo "✓ Checking environment configuration..."
if [ -f ".env" ]; then
    if grep -q "NOTION_API_KEY" .env; then
        echo "  ✓ .env file exists with NOTION_API_KEY"
    else
        echo "  ✗ NOTION_API_KEY not found in .env"
        exit 1
    fi
else
    echo "  ✗ .env file not found"
    exit 1
fi

# Check if main file exists
echo "✓ Checking main files..."
if [ -f "index.js" ]; then
    echo "  ✓ index.js exists"
else
    echo "  ✗ index.js not found"
    exit 1
fi

if [ -f "package.json" ]; then
    echo "  ✓ package.json exists"
else
    echo "  ✗ package.json not found"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "To run the POC:"
echo "  npm start"
echo ""
echo "Don't forget to share a Notion page with your integration!"
