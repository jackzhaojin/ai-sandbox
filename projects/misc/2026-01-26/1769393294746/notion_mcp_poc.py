#!/usr/bin/env python3
"""
Notion MCP Integration POC - Python Version
============================================

This script demonstrates how to integrate with Notion using the Model Context
Protocol (MCP) via the Claude Agent SDK for Python.

Features:
- Connects to Notion's hosted MCP server
- Uses OAuth authentication (managed by MCP)
- Demonstrates AI-powered Notion operations
- Shows natural language query capabilities

Prerequisites:
1. Install dependencies: pip install -r requirements.txt
2. Authenticate Claude: claude setup-token OR set ANTHROPIC_API_KEY
3. Connect to Notion MCP: claude mcp add --transport http notion https://mcp.notion.com/mcp
4. Grant workspace access in Notion
"""

import asyncio
import os
from typing import Any
from dotenv import load_dotenv

try:
    from claude_agent_sdk import query, ClaudeAgentOptions
    from claude_agent_sdk.types import (
        AssistantMessage,
        SystemMessage,
        ResultMessage,
        TextBlock,
        ToolUseBlock,
        ToolResultBlock,
    )
except ImportError as e:
    print("❌ Error: Claude Agent SDK not installed")
    print("   Please run: pip install claude-agent-sdk")
    print(f"   Details: {e}")
    exit(1)


# Load environment variables
load_dotenv()


class NotionMCPPOC:
    """Proof of concept for Notion integration via MCP."""

    def __init__(self):
        """Initialize the POC with MCP configuration."""
        self.mcp_config = {
            "notion": {
                "type": "http",
                "url": "https://mcp.notion.com/mcp"
            }
        }

        self.options = ClaudeAgentOptions(
            mcp_servers=self.mcp_config,
            # Allow all Notion MCP tools
            allowed_tools=[
                "mcp__notion__search_pages",
                "mcp__notion__read_page",
                "mcp__notion__create_page",
                "mcp__notion__update_page",
                "mcp__notion__query_database",
            ],
            # Auto-approve edits for smoother demo
            permission_mode="acceptEdits",
            # Add custom system prompt
            system_prompt="You are a helpful assistant that can interact with Notion. "
                         "Be concise and clear in your responses."
        )

    def print_header(self, text: str, symbol: str = "="):
        """Print a formatted header."""
        print(f"\n{symbol * 70}")
        print(f"  {text}")
        print(f"{symbol * 70}\n")

    def print_message(self, icon: str, message: str):
        """Print a formatted message."""
        print(f"{icon} {message}")

    async def check_mcp_connection(self):
        """Check if Notion MCP is properly configured and authenticated."""
        self.print_header("🔍 Checking MCP Connection", "-")

        try:
            # Try a simple query to check connection
            async for message in query(
                prompt="Check if you can access Notion MCP tools. Just respond with 'ready' if you can.",
                options=self.options
            ):
                if isinstance(message, ResultMessage):
                    if message.is_error:
                        self.print_message("❌", "MCP connection check failed")
                        if "needs-auth" in str(message.result).lower():
                            self.print_auth_instructions()
                        return False
                    else:
                        self.print_message("✅", "MCP connection successful")
                        return True

        except Exception as e:
            self.print_message("❌", f"Connection error: {e}")
            self.print_auth_instructions()
            return False

        return True

    def print_auth_instructions(self):
        """Print authentication setup instructions."""
        self.print_header("🔐 Authentication Required", "!")

        print("Notion MCP requires OAuth authentication. Please follow these steps:\n")
        print("1. Add Notion MCP server:")
        print("   claude mcp add --transport http notion https://mcp.notion.com/mcp\n")
        print("2. Complete the OAuth flow in your browser\n")
        print("3. Grant access to your Notion workspace:\n")
        print("   - Open a page in Notion")
        print("   - Click '...' → 'Add connections'")
        print("   - Select your Notion MCP integration\n")
        print("4. Ensure you have Claude authentication set up:")
        print("   - Option A: Run 'claude setup-token' (for Claude Pro/Max)")
        print("   - Option B: Set ANTHROPIC_API_KEY in .env file\n")

    async def run_query(self, prompt: str, description: str = ""):
        """Run a query and display results."""
        if description:
            self.print_header(f"📝 {description}")

        print(f"Query: {prompt}\n")

        try:
            messages = []
            async for message in query(prompt=prompt, options=self.options):
                messages.append(message)

                # Handle different message types
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            self.print_message("🤖", f"Claude: {block.text}")
                        elif isinstance(block, ToolUseBlock):
                            self.print_message("🔧", f"Using tool: {block.name}")
                            # Optional: print tool input for debugging
                            # print(f"   Input: {block.input}")

                elif isinstance(message, SystemMessage):
                    # Handle system messages (e.g., MCP connection status)
                    if message.subtype == "mcp_server_status":
                        data = message.data
                        if isinstance(data, dict):
                            for server, status in data.items():
                                if status == "connected":
                                    self.print_message("✅", f"{server}: connected")
                                elif status == "needs-auth":
                                    self.print_message("⚠️", f"{server}: needs authentication")
                                else:
                                    self.print_message("ℹ️", f"{server}: {status}")

                elif isinstance(message, ResultMessage):
                    self.print_message("✅", f"Query completed in {message.duration_ms}ms")
                    if message.total_cost_usd:
                        self.print_message("💰", f"Cost: ${message.total_cost_usd:.4f}")

                    if message.is_error:
                        self.print_message("❌", f"Error: {message.result}")

            # Return messages for further processing if needed
            return messages

        except Exception as e:
            self.print_message("❌", f"Query failed: {e}")
            import traceback
            print(traceback.format_exc())
            return []

    async def demo_read_operations(self):
        """Demonstrate reading from Notion."""
        await self.run_query(
            prompt="List the pages in my Notion workspace. Show me the titles and IDs.",
            description="Demo: Reading from Notion"
        )

    async def demo_search_operations(self):
        """Demonstrate searching in Notion."""
        await self.run_query(
            prompt="Search for pages that mention 'project' or 'planning' in my Notion workspace.",
            description="Demo: Searching Notion"
        )

    async def demo_create_operation(self):
        """Demonstrate creating content in Notion."""
        await self.run_query(
            prompt="Create a new page titled 'MCP POC Test' with content: "
                  "'This page was created via the Model Context Protocol using Claude Agent SDK for Python. "
                  "Created on: " + str(__import__('datetime').datetime.now()) + "'",
            description="Demo: Creating in Notion"
        )

    async def demo_custom_query(self, custom_prompt: str):
        """Run a custom user-provided query."""
        await self.run_query(
            prompt=custom_prompt,
            description="Custom Query"
        )

    async def run_all_demos(self):
        """Run all demonstration queries."""
        self.print_header("🚀 Notion MCP POC - Python Edition", "=")

        # Check connection first
        if not await self.check_mcp_connection():
            self.print_message("⚠️", "Skipping demos due to connection issues")
            return

        # Run demos
        await self.demo_read_operations()
        await asyncio.sleep(2)  # Brief pause between demos

        # Uncomment to run additional demos:
        # await self.demo_search_operations()
        # await asyncio.sleep(2)
        #
        # await self.demo_create_operation()
        # await asyncio.sleep(2)

        self.print_header("✨ POC Complete!", "=")


async def main():
    """Main entry point."""
    poc = NotionMCPPOC()

    # You can run all demos or a specific one
    await poc.run_all_demos()

    # Or run a custom query:
    # await poc.demo_custom_query("What databases do I have in Notion?")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 POC interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
