/**
 * Browser management utility for Puppeteer
 * Maintains a single browser instance to avoid constant launch/close overhead
 */

import puppeteer from 'puppeteer';

let browserInstance = null;
let browserLaunchPromise = null;

/**
 * Get or create a browser instance
 * @returns {Promise<Browser>}
 */
async function getBrowser() {
  // If browser is already launching, wait for it
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  // If browser exists and is connected, return it
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // Launch new browser
  browserLaunchPromise = puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-images', // Skip loading images for faster page load
      '--disable-javascript-harmony', // Disable experimental features
      '--disable-extensions',
      '--disable-plugins',
    ],
  });

  try {
    browserInstance = await browserLaunchPromise;
    console.log('[Browser] Puppeteer browser launched');
    
    // Clean up launch promise
    browserLaunchPromise = null;
    
    // Handle browser disconnection
    browserInstance.on('disconnected', () => {
      console.log('[Browser] Browser disconnected');
      browserInstance = null;
    });

    return browserInstance;
  } catch (error) {
    browserLaunchPromise = null;
    throw error;
  }
}

/**
 * Fetch a page with JavaScript rendering
 * @param {string} url - URL to fetch
 * @param {Object} options - Options
 * @param {number} options.waitFor - Time to wait after page load (ms)
 * @param {string} options.waitForSelector - CSS selector to wait for
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @returns {Promise<string>} HTML content
 */
async function fetchWithBrowser(url, options = {}) {
  const { waitFor = 2000, waitForSelector = null, retries = 2 } = options;
  
  let lastError = null;
  
  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    let page = null;
    
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      
      // Block unnecessary resources for faster page load
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        // Block images, fonts, media for faster load
        if (['image', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Set a reasonable viewport
      await page.setViewport({ width: 1280, height: 800 });
      
      // Set user agent to avoid bot detection
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Navigate to page
      if (attempt > 0) {
        console.log(`[Browser] Retry attempt ${attempt} for ${url}`);
      } else {
        console.log(`[Browser] Fetching ${url}`);
      }
      
      // Use domcontentloaded instead of networkidle2 for faster response
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 20000 // Reduced timeout 
      });
      
      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 8000 }); // Reduced timeout
      }
      
      // Additional wait time for dynamic content
      if (waitFor > 0) {
        await new Promise(resolve => setTimeout(resolve, waitFor));
      }
      
      // Get the rendered HTML
      const html = await page.content();
      
      // Validate we got actual content
      if (!html || html.length < 100) {
        throw new Error('Received empty or invalid HTML response');
      }
      
      return html;
      
    } catch (error) {
      lastError = error;
      console.error(`[Browser] Error on attempt ${attempt + 1}:`, error.message);
      
      // If browser disconnected, clear instance for next attempt
      if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
        browserInstance = null;
      }
      
      // Don't retry on final attempt
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore close errors
        }
      }
    }
  }
  
  // All retries failed
  throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts: ${lastError?.message}`);
}

/**
 * Close the browser instance
 */
async function closeBrowser() {
  if (browserInstance) {
    console.log('[Browser] Closing browser');
    await browserInstance.close();
    browserInstance = null;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  if (browserInstance) {
    browserInstance.close();
  }
});

export {
  getBrowser,
  fetchWithBrowser,
  closeBrowser,
};
