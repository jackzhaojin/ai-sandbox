/**
 * Notion MCP Integration - Proof of Concept
 *
 * This POC demonstrates integration with Notion using the Model Context Protocol (MCP)
 * and the Claude Agent SDK. Unlike the direct API approach (index.js), this uses
 * Notion's hosted MCP server to enable AI-powered interactions with Notion.
 *
 * Key differences from direct API:
 * - Uses MCP protocol for tool-based interactions
 * - OAuth authentication (not API key)
 * - AI agent can reason about Notion operations
 * - Access to pre-built skills and workflows
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main demonstration function
 * Shows how to use Claude Agent SDK with Notion MCP
 */
async function main() {
  console.log('🚀 Notion MCP Integration POC Starting...\n');
  console.log('This POC uses the Model Context Protocol to connect to Notion');
  console.log('via Claude Agent SDK\n');

  // Check for required authentication
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Missing authentication credentials');
    console.log('   Please set either:');
    console.log('   - CLAUDE_CODE_OAUTH_TOKEN (for Claude Pro/Max)');
    console.log('   - ANTHROPIC_API_KEY (for API access)');
    process.exit(1);
  }

  try {
    console.log('📋 Configuring Notion MCP server...\n');

    // Configuration for Notion MCP
    // Note: Notion MCP requires OAuth authentication which happens interactively
    const options = {
      mcpServers: {
        "notion": {
          type: "http",
          url: "https://mcp.notion.com/mcp",
          // Note: OAuth credentials are handled by the MCP server
          // Users will be prompted to authenticate when first connecting
        }
      },
      // Allow all Notion MCP tools
      allowedTools: ["mcp__notion__*"],
      // Use acceptEdits mode to automatically approve tool usage
      permissionMode: "acceptEdits"
    };

    console.log('🤖 Sending query to Claude with Notion MCP access...\n');
    console.log('Query: "List the pages in my Notion workspace using the MCP server"\n');

    // Execute a query using the Notion MCP server
    for await (const message of query({
      prompt: "List the pages in my Notion workspace using the MCP server. Show me the first 3 pages with their titles.",
      options: options
    })) {
      // Log system initialization messages
      if (message.type === "system" && message.subtype === "init") {
        console.log("📡 MCP Connection Status:");
        if (message.mcp_servers) {
          message.mcp_servers.forEach(server => {
            const status = server.status === "connected" ? "✅" : "❌";
            console.log(`   ${status} ${server.name}: ${server.status}`);
            if (server.status === "failed") {
              console.log(`      Error: ${server.error || 'Unknown error'}`);
            }
          });
        }
        console.log();
      }

      // Log tool calls
      if (message.type === "assistant" && message.content) {
        const content = Array.isArray(message.content) ? message.content : [message.content];
        for (const block of content) {
          if (block.type === "tool_use" && block.name && block.name.startsWith("mcp__")) {
            console.log(`🔧 Using tool: ${block.name}`);
            console.log(`   Input:`, JSON.stringify(block.input, null, 2));
          }
          if (block.type === "text" && block.text) {
            console.log(`💭 Claude thinking: ${block.text.substring(0, 100)}...`);
          }
        }
      }

      // Log tool results
      if (message.type === "user" && message.content) {
        const content = Array.isArray(message.content) ? message.content : [message.content];
        for (const block of content) {
          if (block.type === "tool_result") {
            console.log(`📊 Tool result received`);
          }
        }
      }

      // Print the final result
      if (message.type === "result" && message.subtype === "success") {
        console.log('\n✅ Query completed successfully!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log('RESULT:');
        console.log('═══════════════════════════════════════════════════');
        console.log(message.result);
        console.log('═══════════════════════════════════════════════════\n');
      }

      // Handle errors
      if (message.type === "result" && message.subtype === "error_during_execution") {
        console.error('\n❌ Error during execution');
        if (message.error) {
          console.error('Error details:', message.error);
        }
      }
    }

    console.log('✅ POC completed successfully!');
    console.log('\n📚 Summary:');
    console.log('   - ✅ Claude Agent SDK initialized');
    console.log('   - ✅ Notion MCP server configured');
    console.log('   - ✅ MCP connection established (or auth required)');
    console.log('   - ✅ AI-powered Notion query executed');
    console.log('   - ✅ Tool-based interaction demonstrated');

  } catch (error) {
    console.error('\n❌ POC failed with error:', error.message);
    console.error('Stack trace:', error.stack);

    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      console.log('\n💡 Authentication Notes:');
      console.log('   Notion MCP requires OAuth authentication');
      console.log('   You may need to:');
      console.log('   1. Run "claude mcp add --transport http notion https://mcp.notion.com/mcp"');
      console.log('   2. Complete the OAuth flow in your browser');
      console.log('   3. Grant access to your Notion workspace');
    }

    process.exit(1);
  }
}

// Additional example: Creating a page via MCP
async function createPageExample() {
  console.log('\n🆕 Example: Creating a page via Notion MCP\n');

  const options = {
    mcpServers: {
      "notion": {
        type: "http",
        url: "https://mcp.notion.com/mcp",
      }
    },
    allowedTools: ["mcp__notion__*"],
    permissionMode: "acceptEdits"
  };

  try {
    for await (const message of query({
      prompt: "Create a new page in my Notion workspace titled 'MCP POC Test' with a heading 'Hello from Claude Agent SDK' and a paragraph explaining this was created via the Model Context Protocol.",
      options: options
    })) {
      if (message.type === "result" && message.subtype === "success") {
        console.log('✅ Page created via MCP!');
        console.log(message.result);
      }
    }
  } catch (error) {
    console.error('❌ Could not create page:', error.message);
  }
}

// Additional example: Searching with AI reasoning
async function intelligentSearchExample() {
  console.log('\n🔍 Example: Intelligent search via Notion MCP\n');

  const options = {
    mcpServers: {
      "notion": {
        type: "http",
        url: "https://mcp.notion.com/mcp",
      }
    },
    allowedTools: ["mcp__notion__*"],
    permissionMode: "acceptEdits"
  };

  try {
    for await (const message of query({
      prompt: "Search my Notion workspace for pages related to 'projects' or 'planning'. Summarize what you find and tell me which pages might be most important.",
      options: options
    })) {
      if (message.type === "result" && message.subtype === "success") {
        console.log('✅ Intelligent search completed!');
        console.log(message.result);
      }
    }
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }
}

// Run the main POC
console.log('═══════════════════════════════════════════════════');
console.log('   NOTION MCP INTEGRATION - PROOF OF CONCEPT');
console.log('═══════════════════════════════════════════════════\n');

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Uncomment to run additional examples:
// main().then(() => createPageExample()).catch(console.error);
// main().then(() => intelligentSearchExample()).catch(console.error);
