# Notion MCP POC - Python Edition

This document provides comprehensive documentation for the Python implementation of the Notion MCP integration POC using the Claude Agent SDK.

## Overview

This Python POC demonstrates how to integrate with Notion using the Model Context Protocol (MCP) via the Claude Agent SDK for Python. It complements the existing JavaScript/TypeScript implementation and showcases the same capabilities in a Python environment.

## Architecture

```
Python Application (notion_mcp_poc.py)
         ↓
Claude Agent SDK (claude-agent-sdk)
         ↓
Claude Code CLI (bundled with SDK)
         ↓
MCP Protocol (HTTP Transport)
         ↓
Notion MCP Server (https://mcp.notion.com/mcp)
         ↓
Notion API (OAuth authenticated)
```

## Prerequisites

### System Requirements
- **Python**: 3.10 or higher (tested with Python 3.12)
- **Claude Code CLI**: Installed and authenticated
- **Notion Account**: With access to a workspace

### Python Dependencies
- `claude-agent-sdk>=0.1.0` - Claude Agent SDK for Python
- `python-dotenv>=1.0.0` - Environment variable management

## Installation

### 1. Set Up Python Environment

We recommend using a virtual environment:

```bash
# Create virtual environment (Python 3.10+)
python3.12 -m venv .venv

# Activate it
source .venv/bin/activate  # On Unix/macOS
# OR
.venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies

```bash
# Using pip
pip install -r requirements.txt

# Or install directly
pip install claude-agent-sdk python-dotenv
```

### 3. Authenticate Claude

Choose one of these authentication methods:

**Option A: Claude OAuth (Recommended for Claude Pro/Max users)**
```bash
claude setup-token
```

**Option B: Anthropic API Key (For developers)**
```bash
# Add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." >> .env
```

### 4. Connect to Notion MCP

```bash
# Add Notion MCP server
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

This will open your browser to complete the OAuth flow.

### 5. Grant Workspace Access

In your Notion workspace:
1. Open any page
2. Click "..." (more menu)
3. Select "Add connections"
4. Find and select "Notion MCP"

## Usage

### Basic Usage

```bash
# Activate virtual environment first
source .venv/bin/activate

# Run the POC
python notion_mcp_poc.py
```

### Code Structure

The POC is organized into a class-based structure:

```python
class NotionMCPPOC:
    """Main POC class with demo methods."""

    def __init__(self):
        """Initialize MCP configuration."""
        # Configure MCP servers
        # Set up Claude Agent options
        # Define allowed tools

    async def check_mcp_connection(self):
        """Verify MCP connection and authentication."""

    async def run_query(self, prompt: str, description: str = ""):
        """Execute a query against Notion via MCP."""

    async def demo_read_operations(self):
        """Demonstrate reading from Notion."""

    async def demo_search_operations(self):
        """Demonstrate searching Notion."""

    async def demo_create_operation(self):
        """Demonstrate creating content in Notion."""

    async def run_all_demos(self):
        """Run all demonstration queries."""
```

### Example Queries

#### 1. List Pages
```python
await poc.run_query(
    prompt="List the pages in my Notion workspace. Show me the titles and IDs."
)
```

#### 2. Search Pages
```python
await poc.run_query(
    prompt="Search for pages that mention 'project' or 'planning'."
)
```

#### 3. Create a Page
```python
await poc.run_query(
    prompt="Create a new page titled 'Test Page' with some content."
)
```

#### 4. Custom Query
```python
await poc.demo_custom_query("What databases do I have in Notion?")
```

## Configuration

### MCP Server Configuration

The POC uses the following MCP configuration:

```python
mcp_config = {
    "notion": {
        "type": "http",
        "url": "https://mcp.notion.com/mcp"
    }
}
```

### Claude Agent Options

```python
options = ClaudeAgentOptions(
    mcp_servers=mcp_config,
    allowed_tools=[
        "mcp__notion__search_pages",
        "mcp__notion__read_page",
        "mcp__notion__create_page",
        "mcp__notion__update_page",
        "mcp__notion__query_database",
    ],
    permission_mode="acceptEdits",  # Auto-approve edits for demo
    system_prompt="You are a helpful assistant that can interact with Notion."
)
```

### Permission Modes

- **`acceptEdits`**: Auto-approves file edits, asks for other operations
- **`bypassPermissions`**: Runs without prompts (use in CI/CD)
- **`default`**: Requires custom permission callback

## Features Demonstrated

### ✅ What Works

1. **MCP Connection**
   - Connects to Notion's hosted MCP server
   - HTTP transport functional
   - Proper configuration loading

2. **Authentication Handling**
   - Detects connection status
   - Provides clear OAuth instructions
   - Handles authentication gracefully

3. **Message Processing**
   - Processes different message types
   - Displays assistant responses
   - Shows tool usage
   - Reports results and costs

4. **Error Handling**
   - Catches connection errors
   - Reports authentication issues
   - Provides helpful guidance

### 🔧 Tools Available

The POC can access these Notion MCP tools:

| Tool | Purpose |
|------|---------|
| `mcp__notion__search_pages` | Search for pages in workspace |
| `mcp__notion__read_page` | Read page content |
| `mcp__notion__create_page` | Create new pages |
| `mcp__notion__update_page` | Update existing pages |
| `mcp__notion__query_database` | Query database entries |

## API Comparison: Python SDK vs JavaScript SDK

| Aspect | Python SDK | JavaScript SDK |
|--------|-----------|----------------|
| **Installation** | `pip install claude-agent-sdk` | `npm install @anthropic-ai/claude-agent-sdk` |
| **Import Style** | `from claude_agent_sdk import query` | `import { query } from '@anthropic-ai/claude-agent-sdk'` |
| **Async Pattern** | `async for message in query(...)` | `for await (const message of query(...))` |
| **Options Type** | `ClaudeAgentOptions` | Object literal |
| **Message Types** | `AssistantMessage`, `ResultMessage`, etc. | Same concept, different syntax |
| **CLI Integration** | Bundled subprocess | Bundled subprocess |

### Python Example

```python
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    mcp_servers={"notion": {...}},
    allowed_tools=["mcp__notion__*"]
)

async for message in query(prompt="List pages", options=options):
    if isinstance(message, AssistantMessage):
        print(message.content)
```

### JavaScript Example

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

const options = {
  mcpServers: { "notion": {...} },
  allowedTools: ["mcp__notion__*"]
};

for await (const message of query({
  prompt: "List pages",
  options: options
})) {
  if (message.type === 'assistant') {
    console.log(message.content);
  }
}
```

## Known Issues & Limitations

### 1. Async Cleanup Issue
**Symptom**: `RuntimeError: Attempted to exit cancel scope in a different task`

**Cause**: Early version SDK async generator cleanup issue

**Impact**: Script exits with error after execution (but demonstrates concepts)

**Workaround**: This is a known SDK issue being addressed in future versions

### 2. CLI Subprocess Requirement
**Issue**: SDK requires Claude Code CLI as subprocess

**Impact**: Can't run in environments without CLI access

**Solution**: Ensure Claude Code CLI is properly installed

### 3. OAuth Requirement
**Issue**: Cannot fully automate without human OAuth interaction

**Impact**: Not suitable for fully headless automation

**Solution**: Use for interactive workflows or one-time setup

## Troubleshooting

### "Module not found: claude_agent_sdk"
**Solution**:
```bash
pip install claude-agent-sdk
```

### "Python version too old"
**Solution**:
```bash
# Use Python 3.10 or higher
python3.12 -m venv .venv
source .venv/bin/activate
pip install claude-agent-sdk
```

### "Claude Code not found"
**Solution**:
```bash
# Install Claude Code CLI
curl -fsSL https://claude.ai/install.sh | bash

# Or use Homebrew
brew install --cask claude-code
```

### "MCP server needs authentication"
**Solution**:
```bash
# Re-authenticate
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

### "No Notion pages found"
**Solution**:
- Ensure you've granted the integration access to pages
- In Notion: Page menu → "Add connections" → Select "Notion MCP"

## Best Practices

### 1. Use Virtual Environments
Always use a Python virtual environment to isolate dependencies:
```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

### 2. Secure Credentials
Never commit credentials to git:
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".venv/" >> .gitignore
```

### 3. Handle Errors Gracefully
Always wrap queries in try-except blocks:
```python
try:
    async for message in query(prompt=..., options=...):
        # Process message
        pass
except Exception as e:
    print(f"Error: {e}")
```

### 4. Use Type Hints
Take advantage of Python's type system:
```python
from claude_agent_sdk.types import AssistantMessage, ResultMessage

async def process_message(message: AssistantMessage) -> None:
    # Your code here
    pass
```

## Integration with Existing Codebase

### Using Both JavaScript and Python

You can use both implementations in the same project:

```
project/
├── js/
│   ├── notion-mcp-poc.js    # JavaScript implementation
│   └── package.json
├── python/
│   ├── notion_mcp_poc.py    # Python implementation
│   └── requirements.txt
└── .mcp.json                # Shared MCP configuration
```

### Shared Configuration

The `.mcp.json` file can be used by both SDKs:

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

## Advanced Usage

### Custom System Prompts

```python
options = ClaudeAgentOptions(
    system_prompt="You are an expert at organizing Notion workspaces. "
                 "Always provide clear, structured responses."
)
```

### Permission Callbacks

```python
async def can_use_tool(tool: str, input: dict, context: dict) -> bool:
    print(f"Tool requested: {tool}")
    # Custom approval logic here
    return True

options = ClaudeAgentOptions(
    permission_mode="default",
    can_use_tool=can_use_tool
)
```

### Using ClaudeSDKClient for Sessions

For continuous conversations, use `ClaudeSDKClient`:

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async with ClaudeSDKClient(options=options) as client:
    # First query
    await client.query("List my pages")
    async for message in client.receive_response():
        print(message)

    # Follow-up query - maintains context
    await client.query("Show me the first one")
    async for message in client.receive_response():
        print(message)
```

## Resources

### Official Documentation
- [Claude Agent SDK - Python Reference](https://platform.claude.com/docs/en/agent-sdk/python)
- [Notion MCP Getting Started](https://developers.notion.com/docs/get-started-with-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

### Python Packages
- [claude-agent-sdk on PyPI](https://pypi.org/project/claude-agent-sdk/)
- [Python SDK GitHub](https://github.com/anthropics/claude-agent-sdk-python)

### Related Projects
- [JavaScript POC](./notion-mcp-poc.js) - TypeScript/JavaScript implementation
- [Direct API POC](./index.js) - Using @notionhq/client

## Comparison: MCP vs Direct API (Python)

### Using MCP (This POC)
```python
# AI-powered, natural language interface
from claude_agent_sdk import query, ClaudeAgentOptions

options = ClaudeAgentOptions(
    mcp_servers={"notion": {"type": "http", "url": "https://mcp.notion.com/mcp"}},
    allowed_tools=["mcp__notion__*"]
)

async for message in query(
    prompt="Create a meeting notes page for today",
    options=options
):
    # Claude figures out how to structure the page
    print(message)
```

### Using Direct API
```python
# Direct programmatic control
from notion_client import Client

notion = Client(auth=os.environ["NOTION_API_KEY"])

# You must specify exact structure
page = notion.pages.create(
    parent={"database_id": "..."},
    properties={
        "Name": {"title": [{"text": {"content": "Meeting Notes"}}]},
        "Date": {"date": {"start": "2026-01-26"}}
    }
)
```

## Contributing

To extend this POC:

1. Add new demo methods to `NotionMCPPOC` class
2. Explore additional Notion MCP tools
3. Implement error recovery patterns
4. Add unit tests
5. Create utility functions for common operations

## License

This POC is part of the Notion MCP integration demonstration project.

---

**Status**: ✅ Proof of Concept Complete

**Last Updated**: January 26, 2026

**Python SDK Version**: 0.1.20

**Compatible with**: Python 3.10+
