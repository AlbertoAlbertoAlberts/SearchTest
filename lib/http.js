/**
 * Shared HTTP utilities for making requests to marketplace sites.
 * Used by all adapters to maintain consistent headers and error handling.
 */

/**
 * Fetches HTML from a marketplace site with browser-like headers.
 * @param {string} url - The URL to fetch
 * @param {object} options - Additional fetch options
 * @returns {Promise<string>} - The HTML response text
 * @throws {Error} - If the request fails
 */
export async function fetchHtml(url, options = {}) {
  const defaultHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const response = await fetch(url, {
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  return await response.text();
}
