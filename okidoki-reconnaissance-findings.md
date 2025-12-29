# Okidoki.ee Reconnaissance Findings

**Date:** 29 December 2025  
**Status:** BLOCKED - Cloudflare Turnstile protection prevents automation

---

## Summary

**Result:** ❌ Okidoki.ee is **NOT suitable** for automated scraping with current tooling.

**Reason:** Site uses Cloudflare Turnstile, which requires human interaction to verify. Puppeteer cannot bypass this protection even with realistic headers and delays.

---

## Test Results

### Test 1: Simple HTTP requests
- **Tool:** `curl`
- **Result:** HTTP 403 Forbidden
- **Response:** Cloudflare challenge page
- **Size:** ~7KB

**Conclusion:** Simple HTTP requests are blocked immediately.

### Test 2: Puppeteer automation
- **Tool:** Puppeteer (headless Chrome)
- **Result:** Stuck on Cloudflare Turnstile challenge
- **Challenge type:** "Verify you are human by completing the action below"
- **Page size:** ~18-20KB (challenge page, not real content)
- **Wait time tested:** 5 seconds (challenge did not resolve)

**Conclusion:** Puppeteer cannot bypass Cloudflare Turnstile without manual intervention.

---

## URL Pattern Discovery

Working URL pattern identified (though blocked by Cloudflare):
```
https://www.okidoki.ee/kuulutused?q={query}
```

Other patterns tested (all returned same Cloudflare challenge):
- `https://www.okidoki.ee/search?q=iphone` → Cloudflare challenge
- `https://www.okidoki.ee/otsing?q=iphone` → Cloudflare challenge
- `https://www.okidoki.ee/?q=iphone` → Cloudflare challenge

**Note:** The URL pattern `/kuulutused` (Estonian for "advertisements") is likely correct, but we cannot verify actual content structure due to Cloudflare protection.

---

## Cloudflare Protection Details

**Protection type:** Cloudflare Turnstile (managed challenge)

**Challenge details:**
- Requires JavaScript execution
- Requires human-like interaction (checkbox or similar)
- Uses `cf-turnstile-response` token
- Challenge script: `https://challenges.cloudflare.com/turnstile/v0/`
- Ray ID: `9b5bdb458e75c7e7` (first test), `9b5bdce25c73e4d0` (detailed test)

**Bypass attempts:**
1. ❌ Simple curl → 403
2. ❌ Puppeteer with `waitUntil: 'networkidle2'` → Challenge page
3. ❌ Puppeteer with 5-second delay → Challenge page still present

---

## Why Cloudflare Turnstile is Problematic

**Turnstile vs Traditional Cloudflare:**
- Traditional Cloudflare (like Osta.ee): Often passable with Puppeteer's realistic browser fingerprint
- **Turnstile (Okidoki.ee):** Requires active human verification, similar to reCAPTCHA
  - Cannot be automated without CAPTCHA-solving services (expensive, against ToS)
  - Even headless browser detection bypass doesn't work
  - Designed specifically to block automation

---

## Comparison with Other Sites

| Site | Protection | Puppeteer Success |
|------|-----------|------------------|
| SS.lv | None | ✅ Not needed (server-rendered) |
| Andele | Cloudflare (managed) | ✅ Works with Puppeteer |
| Osta.ee | Cloudflare (404s) | ❌ Site structure issues |
| **Okidoki.ee** | **Cloudflare Turnstile** | **❌ Cannot bypass** |

---

## Recommendation

**Skip Okidoki.ee and move to alternative Estonian marketplaces:**

1. **Soov.ee** - Try next
2. **City24.ee** - Real estate but may have general classifieds
3. **Kuldne Börs** - Estonian classifieds site
4. **Expand to Finland/Latvia:**
   - Tori.fi (Finland, similar to SS.lv)
   - Skelbiu.lt (Lithuania)

---

## Technical Artifacts

Files created during reconnaissance:
- `test-okidoki-access.js` - Initial accessibility test
- `test-okidoki-detailed.js` - Detailed Cloudflare bypass attempt
- `okidoki-search-sample.html` - Saved Cloudflare challenge page (18KB)
- `okidoki-challenge-page.html` - Detailed challenge page (20KB)
- `okidoki-reconnaissance-findings.md` - This file

---

## Lessons Learned (vs Osta.ee)

**Osta.ee problems:**
- All URLs returned 404
- Site may be offline or completely restructured
- Cloudflare was secondary issue

**Okidoki.ee problems:**
- Site is online and functioning
- But uses Turnstile (human verification required)
- **This is WORSE than 404s** - site exists but is intentionally blocking automation

**Key insight:** Some Estonian marketplaces actively prevent automated access with strong anti-bot measures. Need to find sites without Turnstile/reCAPTCHA.

---

## Next Steps

1. ✅ Mark Okidoki.ee as unsuitable in plan
2. ⏳ Create plan for **Soov.ee** as next attempt
3. ⏳ If Soov.ee also fails, consider:
   - Expanding to neighboring countries (Finland, Latvia)
   - Looking for sites with public APIs
   - Using RSS feeds if available

---

**Conclusion:** Okidoki.ee is technically accessible but intentionally blocks automation with Cloudflare Turnstile. Recommend moving to Soov.ee or other Estonian marketplaces that don't use Turnstile protection.
