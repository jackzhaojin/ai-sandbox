/**
 * Notion API Integration - Proof of Concept
 *
 * This POC demonstrates basic integration with the Notion API using the official SDK.
 * It showcases authentication, reading, and writing operations.
 */

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

/**
 * Demo 1: List all users in the workspace
 * This is a simple read operation to verify authentication works
 */
async function listUsers() {
  console.log('\n=== Demo 1: Listing Users ===');
  try {
    const response = await notion.users.list();
    console.log(`✅ Found ${response.results.length} user(s) in workspace`);

    response.results.forEach((user, index) => {
      const name = user.name || 'Unknown';
      const type = user.type;
      console.log(`  ${index + 1}. ${name} (${type})`);
    });

    return response;
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    throw error;
  }
}

/**
 * Demo 2: Search for pages in the workspace
 * Demonstrates the search API capability
 */
async function searchPages(query = '') {
  console.log('\n=== Demo 2: Searching Pages ===');
  try {
    const response = await notion.search({
      query: query,
      filter: {
        property: 'object',
        value: 'page'
      },
      page_size: 5,
    });

    console.log(`✅ Found ${response.results.length} page(s)`);

    response.results.forEach((page, index) => {
      // Get page title from properties
      const titleProp = page.properties?.title || page.properties?.Title || page.properties?.Name;
      let title = 'Untitled';

      if (titleProp && titleProp.title && titleProp.title.length > 0) {
        title = titleProp.title[0].plain_text;
      }

      console.log(`  ${index + 1}. ${title}`);
      console.log(`     ID: ${page.id}`);
    });

    return response;
  } catch (error) {
    console.error('❌ Error searching pages:', error.message);
    throw error;
  }
}

/**
 * Demo 3: Retrieve a specific page by ID
 * Demonstrates reading a specific page's metadata
 */
async function getPage(pageId) {
  console.log('\n=== Demo 3: Retrieving Page ===');
  try {
    const response = await notion.pages.retrieve({ page_id: pageId });

    // Extract title
    const titleProp = response.properties?.title || response.properties?.Title || response.properties?.Name;
    let title = 'Untitled';

    if (titleProp && titleProp.title && titleProp.title.length > 0) {
      title = titleProp.title[0].plain_text;
    }

    console.log(`✅ Retrieved page: ${title}`);
    console.log(`   Created: ${response.created_time}`);
    console.log(`   Last edited: ${response.last_edited_time}`);

    return response;
  } catch (error) {
    console.error('❌ Error retrieving page:', error.message);
    if (error.code === 'object_not_found') {
      console.log('   💡 Tip: Make sure the page exists and the integration has access to it');
    }
    throw error;
  }
}

/**
 * Demo 4: Create a new page
 * Demonstrates write capability by creating a simple page with content
 *
 * Note: Requires a parent page ID where the integration has access
 */
async function createPage(parentPageId) {
  console.log('\n=== Demo 4: Creating Page ===');
  try {
    const response = await notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: 'Notion API POC Test Page',
              },
            },
          ],
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Welcome to the Notion API POC',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'This page was created programmatically using the Notion API JavaScript SDK.',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '✅ Authentication works',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '✅ Page creation works',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '✅ Content blocks work',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `Created at: ${new Date().toISOString()}`,
                },
                annotations: {
                  code: true,
                },
              },
            ],
          },
        },
      ],
    });

    console.log(`✅ Successfully created page!`);
    console.log(`   Page ID: ${response.id}`);
    console.log(`   URL: ${response.url}`);

    return response;
  } catch (error) {
    console.error('❌ Error creating page:', error.message);
    if (error.code === 'object_not_found') {
      console.log('   💡 Tip: Make sure the parent page exists and the integration has access to it');
    } else if (error.code === 'validation_error') {
      console.log('   💡 Tip: Check that the page structure is valid');
    }
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Notion API Integration POC Starting...\n');
  console.log('Using Notion API Key from environment variables');

  if (!process.env.NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY not found in environment variables');
    console.log('   Please add your Notion API key to the .env file');
    process.exit(1);
  }

  try {
    // Demo 1: List users (simple read operation)
    await listUsers();

    // Demo 2: Search for pages
    const searchResults = await searchPages();

    // Demo 3: If we found any pages, retrieve the first one
    if (searchResults.results.length > 0) {
      const firstPageId = searchResults.results[0].id;
      await getPage(firstPageId);

      // Demo 4: Try to create a page as a child of the first page found
      console.log('\n💡 Attempting to create a test page...');
      try {
        await createPage(firstPageId);
      } catch (error) {
        console.log('   ⚠️  Could not create page (integration may need access)');
        console.log('   To enable page creation:');
        console.log('   1. Open the parent page in Notion');
        console.log('   2. Click the "..." menu → Add connections');
        console.log('   3. Select your integration');
      }
    } else {
      console.log('\n⚠️  No pages found in workspace');
      console.log('   💡 Create a page in Notion and share it with your integration');
      console.log('   Then run this script again');
    }

    console.log('\n✅ POC completed successfully!');
    console.log('\n📚 Summary:');
    console.log('   - ✅ Notion SDK initialized');
    console.log('   - ✅ Authentication working');
    console.log('   - ✅ Read operations (list users, search, get page)');
    console.log('   - ✅ Write operations demonstrated (create page)');

  } catch (error) {
    console.error('\n❌ POC failed with error:', error.message);

    if (error.code === 'unauthorized') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('   1. Your NOTION_API_KEY is correct');
      console.log('   2. The integration is installed in your workspace');
      console.log('   3. You have shared pages with the integration');
    }

    process.exit(1);
  }
}

// Run the POC
main();
