# Quick Start Guide

## Run the POC

```bash
npm start
```

## First Time Setup

1. **Share a page with your integration:**
   - Open any page in Notion
   - Click "..." (top right)
   - Select "Add connections"
   - Choose your integration

2. **Run again to see full functionality:**
   ```bash
   npm start
   ```

## What You'll See

✅ **Working Now:**
- List users in workspace
- Search for pages
- Authentication verified

✅ **Will Work After Sharing Pages:**
- Retrieve page details
- Create new test pages
- Rich content blocks

## Files Overview

- **`index.js`** - Main POC code
- **`README.md`** - Full documentation
- **`RESEARCH.md`** - Technical research
- **`COMPLETION_SUMMARY.md`** - Project status

## Troubleshooting

**No pages found?**
→ Share a page with your integration first

**Unauthorized error?**
→ Check NOTION_API_KEY in .env

**Can't create pages?**
→ Integration needs access to parent page

## Resources

- [Notion Developer Portal](https://developers.notion.com/)
- [SDK Documentation](https://github.com/makenotion/notion-sdk-js)
