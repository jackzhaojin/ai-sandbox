const https = require('https');

const SUPABASE_URL = 'https://lmbrqiwzowiquebtsfyc.supabase.co';
const ANON_KEY = 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY';

const url = new URL('/rest/v1/recipes', SUPABASE_URL);
url.searchParams.append('select', 'count');

const options = {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  }
};

https.get(url, options, (res) => {
  const contentRange = res.headers['content-range'];
  console.log('Status:', res.statusCode);
  console.log('Content-Range:', contentRange);
  
  if (res.statusCode === 200 && contentRange) {
    const count = contentRange.split('/')[1];
    console.log('Recipes count:', count);
    process.exit(count > 0 ? 0 : 1);
  } else if (res.statusCode === 404 || res.statusCode === 406) {
    console.log('Table does not exist or schema not pushed');
    process.exit(2);
  }
}).on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(3);
});
