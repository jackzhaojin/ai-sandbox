#!/usr/bin/env node

/**
 * Simple test script to verify routing works correctly
 */

const BASE_URL = 'http://localhost:3000';

async function testRouting() {
  console.log('🧪 Testing PageForge CMS Routing Fix\n');

  // Test 1: Check if protected routes redirect to login
  console.log('Test 1: Protected routes should redirect to login');
  const sitesResponse = await fetch(`${BASE_URL}/sites`, { redirect: 'manual' });
  if (sitesResponse.status === 307 && sitesResponse.headers.get('location').includes('/login')) {
    console.log('✅ /sites correctly redirects to /login when not authenticated\n');
  } else {
    console.log('❌ /sites did not redirect to /login\n');
  }

  // Test 2: Check if login page loads
  console.log('Test 2: Login page should load');
  const loginResponse = await fetch(`${BASE_URL}/login`);
  if (loginResponse.status === 200) {
    const html = await loginResponse.text();
    if (html.includes('Sign In to PageForge')) {
      console.log('✅ Login page loads correctly\n');
    } else {
      console.log('❌ Login page content not found\n');
    }
  } else {
    console.log('❌ Login page did not load\n');
  }

  // Test 3: Check if root page loads
  console.log('Test 3: Root page should load');
  const rootResponse = await fetch(`${BASE_URL}/`);
  if (rootResponse.status === 200) {
    const html = await rootResponse.text();
    if (html.includes('Welcome to PageForge CMS')) {
      console.log('✅ Root page loads correctly\n');
    } else {
      console.log('❌ Root page content not found\n');
    }
  } else {
    console.log('❌ Root page did not load\n');
  }

  console.log('📊 Manual Verification Needed:');
  console.log('1. Login with: admin@pageforge.dev / password123');
  console.log('2. Verify redirect to /sites (not /dashboard)');
  console.log('3. Click sidebar links and verify they work');
  console.log('4. Check that no 404 errors occur\n');
}

testRouting().catch(console.error);
