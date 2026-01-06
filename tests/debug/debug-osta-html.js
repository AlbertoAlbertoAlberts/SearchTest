/**
 * Debug script to save Osta.ee HTML for inspection
 */

import { fetchWithBrowser } from './lib/browser.js';
import fs from 'fs/promises';

async function saveHtml() {
  try {
    console.log('Fetching Osta.ee search page...');
    const html = await fetchWithBrowser('https://www.osta.ee/search?q=iphone', {
      waitFor: 3000,
      retries: 1,
    });
    
    console.log(`Received ${html.length} bytes of HTML`);
    
    await fs.writeFile('/tmp/osta-search.html', html);
    console.log('Saved to /tmp/osta-search.html');
    
    // Also print first 2000 chars
    console.log('\n=== First 2000 chars ===\n');
    console.log(html.substring(0, 2000));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

saveHtml();
