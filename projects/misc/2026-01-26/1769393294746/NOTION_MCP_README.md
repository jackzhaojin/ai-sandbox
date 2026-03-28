# Notion MCP Integration - Proof of Concept

A proof of concept demonstrating integration with Notion using the **Model Context Protocol (MCP)** and the **Claude Agent SDK**. This approach differs from the direct API integration (see `index.js`) by using MCP's standardized protocol for AI-tool interactions.

## 🎯 What is This POC?

This POC demonstrates two approaches to Notion integration:

1. **Direct API Approach** (`index.js`) - Uses `@notionhq/client` SDK directly
2. **MCP Approach** (`notion-mcp-poc.js`) - Uses Claude Agent SDK with Notion's MCP server

### Why MCP?

The Model Context Protocol provides:
- ✅ Standardized interface for AI-tool communication
- ✅ AI reasoning about Notion operations
- ✅ Access to pre-built Notion skills and workflows
- ✅ OAuth-based secure authentication
- ✅ Better integration with AI assistants like Claude

## 🏗️ Architecture

```
┌─────────────────┐
│  Your App       │
│  (Node.js)      │
└────────┬────────┘
         │ Uses
         ▼
┌─────────────────┐
│ Claude Agent    │
│ SDK             │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│ Notion MCP      │
│ Server          │
│ (Hosted)        │
└────────┬────────┘
         │ OAuth + API
         ▼
┌─────────────────┐
│ Notion API      │
└─────────────────┘
```

## 📋 Prerequisites

1. **Node.js** >= 18.0.0
2. **Notion Account** with a workspace
3. **Claude Authentication**:
   - Option A: Claude Pro/Max account with OAuth token
   - Option B: Anthropic API key from https://console.anthropic.com/

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@anthropic-ai/claude-agent-sdk` - For MCP integration
- `@notionhq/client` - For direct API integration
- `dotenv` - For environment variables

### Step 2: Configure Authentication

The `.env` file should contain one of the following:

**Option A: Claude OAuth Token** (for Claude Pro/Max users)
```bash
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
```

To obtain this token:
```bash
claude setup-token
```

**Option B: Anthropic API Key** (for developers)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get your API key from: https://console.anthropic.com/

### Step 3: Configure Notion MCP Connection

The project includes a `.mcp.json` file that configures the Notion MCP server:

```json
{
  "mcpServers": {
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

This configuration is automatically loaded by the Claude Agent SDK.

### Step 4: Authenticate with Notion (OAuth)

⚠️ **Important**: Notion MCP requires OAuth authentication, not an API key!

**Method 1: Via Claude Code CLI** (Recommended)
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

This will:
1. Open a browser window for OAuth
2. Ask you to authorize access to your Notion workspace
3. Save the OAuth credentials securely

**Method 2: First Run Authentication**

When you first run the POC, the MCP server will return a `needs-auth` status. You'll need to:
1. Complete the OAuth flow in your browser
2. Grant permissions to your Notion workspace
3. Re-run the script

### Step 5: Share Pages with the Integration

Even after OAuth, you may need to grant the integration access to specific pages:

1. Open a page in Notion
2. Click the **"..."** menu → **"Add connections"**
3. Look for your Notion MCP integration
4. Select it to grant access

## 🎮 Usage

### Run the MCP POC

```bash
npm run start:mcp
```

Or directly:
```bash
node notion-mcp-poc.js
```

### Run the Direct API POC (for comparison)

```bash
npm start
```

## 📊 What the POC Does

The Notion MCP POC demonstrates:

### 1. MCP Connection Setup
```javascript
const options = {
  mcpServers: {
    "notion": {
      type: "http",
      url: "https://mcp.notion.com/mcp"
    }
  },
  allowedTools: ["mcp__notion__*"],
  permissionMode: "acceptEdits"
};
```

### 2. AI-Powered Queries
```javascript
for await (const message of query({
  prompt: "List the pages in my Notion workspace using the MCP server",
  options: options
})) {
  // Process results
}
```

### 3. Tool-Based Interactions

The AI agent can:
- Search for pages intelligently
- Create pages with natural language instructions
- Update existing content
- Query databases
- Reason about Notion operations

## 🔍 Expected Output

### Successful Connection

```
═══════════════════════════════════════════════════
   NOTION MCP INTEGRATION - PROOF OF CONCEPT
═══════════════════════════════════════════════════

🚀 Notion MCP Integration POC Starting...

📋 Configuring Notion MCP server...

🤖 Sending query to Claude with Notion MCP access...

📡 MCP Connection Status:
   ✅ notion: connected

🔧 Using tool: mcp__notion__search_pages
   Input: { "query": "" }

📊 Tool result received

✅ Query completed successfully!

═══════════════════════════════════════════════════
RESULT:
═══════════════════════════════════════════════════
I found 3 pages in your Notion workspace:

1. Project Planning
2. Meeting Notes
3. Resource Library
═══════════════════════════════════════════════════
```

### Needs Authentication

```
📡 MCP Connection Status:
   ❌ notion: needs-auth

💡 Authentication Notes:
   Notion MCP requires OAuth authentication
   You may need to:
   1. Run "claude mcp add --transport http notion https://mcp.notion.com/mcp"
   2. Complete the OAuth flow in your browser
   3. Grant access to your Notion workspace
```

## 🆚 MCP vs Direct API Comparison

| Feature | Direct API (`index.js`) | MCP (`notion-mcp-poc.js`) |
|---------|-------------------------|---------------------------|
| **Authentication** | API Key | OAuth 2.0 |
| **Setup Complexity** | Simple | Moderate |
| **AI Reasoning** | ❌ | ✅ |
| **Natural Language** | ❌ | ✅ |
| **Tool Abstraction** | ❌ | ✅ |
| **Pre-built Skills** | ❌ | ✅ |
| **Direct Control** | ✅ | ❌ |
| **Flexibility** | High | Medium |
| **Use Case** | Programmatic operations | AI-assisted workflows |

## 🔧 Available MCP Tools

The Notion MCP server provides tools for:
- Searching pages and databases
- Creating and updating pages
- Reading page content
- Managing databases
- Working with blocks
- And more...

**Note**: Full tool list available at https://developers.notion.com/llms.txt

## ⚠️ Common Issues

### Issue: "needs-auth" Status

**Cause**: OAuth authentication not completed

**Solution**:
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

### Issue: "No matching version found for @anthropic-ai/claude-agent-sdk"

**Cause**: Incorrect package version

**Solution**: Package is at version 0.2.x, not 0.8.x. The `package.json` has been updated with the correct version.

### Issue: "message.content is not iterable"

**Cause**: SDK version incompatibility or message structure changes

**Solution**: The POC code handles both array and non-array content formats.

### Issue: Integration Can't See Pages

**Cause**: Pages not shared with the integration

**Solution**: Open each page in Notion → "..." menu → "Add connections" → Select your integration

## 📚 Additional Examples

The POC file includes commented-out examples for:

### Creating Pages with AI
```javascript
await createPageExample();
// Creates a page using natural language instructions
```

### Intelligent Search
```javascript
await intelligentSearchExample();
// AI-powered search with reasoning and summarization
```

To run these, uncomment the relevant lines at the end of `notion-mcp-poc.js`.

## 🔐 Security Notes

- ✅ OAuth tokens are handled by the Claude Agent SDK
- ✅ Credentials are not stored in code
- ✅ `.env` file is gitignored
- ⚠️ Never commit OAuth tokens or API keys
- ⚠️ Use environment variables for all secrets

## 🚧 Limitations

Current limitations of this POC:

1. **OAuth Flow**: Requires interactive authentication (can't be fully automated)
2. **Image Uploads**: Not supported by Notion MCP yet
3. **File Uploads**: Not supported by Notion MCP yet
4. **Batch Operations**: Limited compared to direct API
5. **Rate Limiting**: Subject to both MCP and Notion API limits

## 📖 Resources

### Notion MCP Documentation
- [Getting Started with MCP](https://developers.notion.com/docs/get-started-with-mcp)
- [Notion MCP Overview](https://developers.notion.com/docs/mcp)
- [Notion Help: MCP](https://www.notion.com/help/notion-mcp)

### Claude Agent SDK Documentation
- [MCP Integration Guide](https://platform.claude.com/docs/en/agent-sdk/mcp)
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Quickstart Guide](https://platform.claude.com/docs/en/agent-sdk/quickstart)

### Model Context Protocol
- [MCP Official Site](https://modelcontextprotocol.io/)
- [MCP Specification](https://modelcontextprotocol.io/docs/getting-started/intro)
- [MCP Server Directory](https://github.com/modelcontextprotocol/servers)

### GitHub Repositories
- [Notion MCP Server](https://github.com/ccabanillas/notion-mcp)
- [Claude Agent SDK (TypeScript)](https://github.com/anthropics/claude-agent-sdk-typescript)
- [MCP Official Servers](https://github.com/modelcontextprotocol/servers)

## 🎯 Next Steps

To extend this POC, you could:

- [ ] Implement database queries via MCP
- [ ] Add more complex AI-powered workflows
- [ ] Build a CLI tool using the MCP integration
- [ ] Create a web interface with MCP backend
- [ ] Explore other MCP servers (GitHub, Slack, etc.)
- [ ] Combine multiple MCP servers in one agent
- [ ] Add comprehensive error handling and retry logic
- [ ] Implement credential refresh for OAuth tokens

## 📄 License

ISC

## 🙏 Acknowledgments

This POC demonstrates:
- Notion's hosted MCP server
- Anthropic's Claude Agent SDK
- The Model Context Protocol standard

All trademarks and brands are property of their respective owners.
