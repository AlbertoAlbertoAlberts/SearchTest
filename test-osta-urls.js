/**
 * Test different Osta.ee URL patterns to find the correct search URL
 */

import { fetchWithBrowser } from './lib/browser.js';

async function testUrls() {
  const testUrls = [
    'https://www.osta.ee/',
    'https://www.osta.ee/search?q=iphone',
    'https://www.osta.ee/otsi?q=iphone',
    'https://www.osta.ee/otsing?q=iphone',
    'https://www.osta.ee/otsing/iphone',
    'https://www.osta.ee/search/iphone',
    'https://www.osta.ee/reklaamid?q=iphone',
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`\n=== Testing: ${url} ===`);
      const html = await fetchWithBrowser(url, { waitFor: 2000, retries: 0 });
      
      const has404 = html.includes('läinud kaduma') || html.includes('404') || html.includes('not found');
      const hasListings = html.includes('listing') || html.includes('ad-') || html.includes('item-');
      const bodyLength = html.length;
      
      console.log(`Length: ${bodyLength} bytes`);
      console.log(`Has 404: ${has404 ? 'YES (404 error)' : 'NO'}`);
      console.log(`Might have listings: ${hasListings ? 'YES' : 'NO'}`);
      
      if (!has404 && bodyLength > 20000) {
        console.log('✅ This URL looks promising!');
      }
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  
  process.exit(0);
}

testUrls();
