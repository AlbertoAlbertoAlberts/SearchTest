# Soov.ee Phase 1 Reconnaissance Findings

**Date:** 29 December 2025  
**Status:** ❌ BLOCKED - Cloudflare Turnstile protection

---

## Summary

**Result:** Soov.ee is **NOT accessible** for automated scraping.

**Reason:** Homepage bypasses Cloudflare challenge, but ALL search URLs are protected by Cloudflare Turnstile (human verification required).

---

## Test Results

### Test 1: Homepage
- **HTTP:** 403 Forbidden (curl)
- **Puppeteer:** ✅ Bypassed after delay
- **Size:** 6.3MB (large homepage, likely JS-heavy)
- **Content:** Real homepage loaded successfully

**Conclusion:** Homepage is accessible with Puppeteer.

### Test 2: Search URLs
**All patterns tested returned Cloudflare Turnstile:**

| URL Pattern | Result |
|------------|--------|
| `/search?q=iphone` | ❌ Turnstile (~19KB) |
| `/otsi?q=iphone` | ❌ Turnstile (~19KB) |
| `/otsing?q=iphone` | ❌ Turnstile (~19KB) |
| `/kuulutused?q=iphone` | ❌ Turnstile (~19KB) |
| `/?q=iphone` | ❌ Turnstile (~19KB) |

**Conclusion:** Search functionality is protected by Turnstile. Cannot proceed.

---

## Protection Details

**Type:** Cloudflare Turnstile (same as Okidoki.ee)

**Characteristics:**
- Homepage bypasses with Puppeteer (6.3MB response)
- Search pages show `cf-chl-widget` or `cf-turnstile`
- Requires human interaction to verify
- Cannot be automated without CAPTCHA-solving services

---

## Comparison with Previous Sites

| Site | Homepage | Search | Result |
|------|----------|--------|--------|
| SS.lv | ✅ No protection | ✅ Works | ✅ Implemented |
| Andele | ⚠️ Cloudflare | ✅ Puppeteer works | ✅ Implemented |
| Osta.ee | ❌ 404 errors | ❌ 404 errors | ❌ Skipped |
| Okidoki.ee | ⚠️ Cloudflare | ❌ Turnstile | ❌ Skipped |
| **Soov.ee** | ✅ Puppeteer works | ❌ **Turnstile** | ❌ **Skip** |

---

## Estonian Marketplace Summary

**All 3 Estonian sites tested = ALL BLOCKED:**
1. Osta.ee - 404 errors (site issues)
2. Okidoki.ee - Turnstile protection
3. Soov.ee - Turnstile protection on search

**Conclusion:** Estonian marketplaces appear to actively prevent automated access with strong anti-bot measures.

---

## Recommendation

**❌ SKIP Soov.ee** - Move to Phase 2 (Skelbiu.lt - Lithuania)

**Why continue testing:**
- Lithuania and Finland may have different protection policies
- Baltic/Nordic countries may be less restrictive
- Need to find at least 1-2 accessible marketplaces

**Alternative strategy if all fail:**
- Focus on improving existing sources (SS.lv, Andele)
- Look for sites with public APIs
- Consider RSS feeds
- Expand to Poland (OLX, Allegro)

---

## Next Steps

**Immediate:** Begin Phase 2 - Test Skelbiu.lt (Lithuania)

**If Phase 2 fails:** Test Tori.fi (Finland) - considered high-priority, quality source

**If all 4 sites fail:** Re-evaluate scraping strategy entirely

---

**Phase 1 Complete: 20 minutes**  
**Decision: SKIP to Phase 2**
