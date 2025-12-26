import * as cheerio from "cheerio";

function guessSearchUrl(q) {
  // IMPORTANT:
  // Replace this with the real ss.com search results URL pattern.
  // How to get it:
  // 1) Go to ss.com, search for something manually
  // 2) Copy the results page URL
  // 3) Paste it here and replace the query part with ${encodeURIComponent(q)}
  //
  // Example placeholder (WILL NOT WORK until you replace it):
  return `https://www.ss.com/en/search-result/?q=${encodeURIComponent(q)}`;
}

export default async function handler(req, res) {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) return res.status(400).json({ error: "Missing q" });

    const url = guessSearchUrl(q);

    const r = await fetch(url, {
      headers: {
        // Pretend to be a normal browser (often helps)
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ error: `Upstream HTTP ${r.status} fetching ${url}` });
    }

    const html = await r.text();
    const $ = cheerio.load(html);

    // IMPORTANT:
    // You must set selectors that match ss.com’s search results HTML.
    // We start with a very generic approach:
    // - pick links that look like listing links
    // - extract title text + nearby price if possible
    //
    // If this returns 0 items, we’ll adjust selectors based on the page HTML.
    const items = [];

    $("a").each((_, a) => {
      const href = $(a).attr("href");
      const title = $(a).text().trim().replace(/\s+/g, " ");
      if (!href || !title) return;

      // Basic filter: keep only “detail-like” links, skip navigation
      // You will likely need to refine this after first run.
      if (href.includes("msg") || href.includes("item") || href.match(/\/\w+\/\d+\.html/)) {
        const link = href.startsWith("http") ? href : new URL(href, url).toString();

        items.push({
          title,
          price: "", // we’ll fill later once we know where it lives in HTML
          link,
          source: "ss.com",
        });
      }
    });

    // Deduplicate by link
    const seen = new Set();
    const deduped = items.filter((it) => {
      if (!it.link || seen.has(it.link)) return false;
      seen.add(it.link);
      return true;
    });

    res.status(200).json({
      url_used: url,
      count: deduped.length,
      items: deduped.slice(0, 30),
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}