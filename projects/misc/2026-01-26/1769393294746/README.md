# Notion API Integration - Proof of Concept

A simple proof of concept demonstrating integration with the Notion API using the official [@notionhq/client](https://www.npmjs.com/package/@notionhq/client) JavaScript SDK.

## Features

This POC demonstrates the following capabilities:

✅ **Authentication** - Connecting to Notion API with an integration token
✅ **Read Operations** - Listing users, searching pages, retrieving page details
✅ **Write Operations** - Creating new pages with rich content blocks
✅ **Error Handling** - Graceful error messages with helpful tips

## Prerequisites

1. **Node.js** >= 18.0.0
2. **Notion Account** with admin access to a workspace
3. **Notion Integration** set up with an API key

## Setup Instructions

### 1. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "API POC")
4. Select the workspace you want to use
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** (starts with `ntn_`)

### 2. Configure Environment Variables

The `.env` file should already contain your Notion API key:

```bash
NOTION_API_KEY=ntn_your_api_key_here
```

### 3. Share Pages with Your Integration

⚠️ **Important**: Notion integrations don't have access to any pages by default!

To grant access:
1. Open a page in Notion (this will be the parent for test pages)
2. Click the **"..."** menu in the top right
3. Scroll down to **"Add connections"**
4. Select your integration from the list

## Installation

Install dependencies:

```bash
npm install
```

## Usage

Run the POC:

```bash
npm start
```

Or directly:

```bash
node index.js
```

## What It Does

The POC runs four demonstrations:

### Demo 1: List Users
Lists all users in the workspace to verify authentication.

```javascript
const response = await notion.users.list();
```

### Demo 2: Search Pages
Searches for pages in the workspace.

```javascript
const response = await notion.search({
  query: '',
  filter: { property: 'object', value: 'page' }
});
```

### Demo 3: Retrieve Page
Fetches details about a specific page by ID.

```javascript
const response = await notion.pages.retrieve({ page_id: pageId });
```

### Demo 4: Create Page
Creates a new page with rich content (heading, paragraphs, bullet list).

```javascript
const response = await notion.pages.create({
  parent: { type: 'page_id', page_id: parentPageId },
  properties: { title: [...] },
  children: [...]
});
```

## Expected Output

```
🚀 Notion API Integration POC Starting...

=== Demo 1: Listing Users ===
✅ Found 1 user(s) in workspace
  1. John Doe (person)

=== Demo 2: Searching Pages ===
✅ Found 3 page(s)
  1. My Project Notes
     ID: abc123...
  2. Weekly Planning
     ID: def456...
  3. Resources
     ID: ghi789...

=== Demo 3: Retrieving Page ===
✅ Retrieved page: My Project Notes
   Created: 2026-01-20T10:30:00.000Z
   Last edited: 2026-01-25T15:45:00.000Z

=== Demo 4: Creating Page ===
✅ Successfully created page!
   Page ID: xyz123...
   URL: https://www.notion.so/...

✅ POC completed successfully!
```

## Common Issues

### "unauthorized" Error
- **Cause**: Invalid API key or integration not installed
- **Fix**: Verify your `NOTION_API_KEY` in `.env` is correct

### "object_not_found" Error
- **Cause**: Integration doesn't have access to the page
- **Fix**: Share the page with your integration (see Setup step 3)

### No Pages Found
- **Cause**: No pages are shared with the integration
- **Fix**: Share at least one page with your integration

## API Reference

- [Notion API Documentation](https://developers.notion.com/)
- [Official JavaScript SDK](https://github.com/makenotion/notion-sdk-js)
- [API Reference](https://developers.notion.com/reference/intro)

## Project Structure

```
.
├── index.js           # Main POC implementation
├── package.json       # Node.js dependencies
├── .env              # Environment variables (API key)
├── .gitignore        # Git ignore rules
├── README.md         # This file
└── RESEARCH.md       # Research findings and approach
```

## Technical Details

- **SDK Version**: @notionhq/client ^5.8.0
- **Node.js**: ES Modules (type: "module")
- **Authentication**: Internal integration (API key)
- **API Version**: 2025-09-03 compatible

## Security Notes

⚠️ **Never commit your `.env` file or expose your API key**
- The `.env` file is already in `.gitignore`
- API keys should be treated as passwords
- Rotate your key if it's ever exposed

## Next Steps

This POC can be extended to:
- [ ] Query and filter databases
- [ ] Update existing pages
- [ ] Handle pagination for large result sets
- [ ] Implement database property updates
- [ ] Add comprehensive error handling
- [ ] Create a web interface
- [ ] Set up OAuth for public integrations

## License

ISC

## Resources

- [Notion API Getting Started](https://developers.notion.com/docs/getting-started)
- [Notion API Crash Course](https://thomasjfrank.com/notion-api-crash-course/)
- [SitePoint Tutorial](https://www.sitepoint.com/notion-api-javascript-sdk/)
