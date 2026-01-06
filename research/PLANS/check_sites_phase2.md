# Phase 2: Finland & Poland Marketplace Testing Plan

**Objective**: Test remaining 5 marketplace sites from SPEC.md for accessibility and scraping feasibility  
**Testing Period**: Following completion of Phase 1 (Baltic sites)  
**Methodology**: Same as Phase 1 - systematic curl → Puppeteer → structure analysis

---

## Testing Strategy

### Success Criteria
✅ **Accessible**: NO Turnstile, Puppeteer can fetch HTML, listings visible  
⚠️ **Conditional**: Accessible but with limitations/warnings  
❌ **Blocked**: Turnstile present, or no access to listing data

### Testing Steps (Per Site)
1. **Quick curl test** - Check HTTP response, basic accessibility
2. **Puppeteer test** - Create test script with multiple URL patterns
3. **Turnstile detection** - Check for Cloudflare challenge pages
4. **HTML structure analysis** - If accessible, identify listing selectors
5. **Findings documentation** - Create {site}-findings.md if viable

### Test Queries
- English: "iphone", "laptop", "samsung"
- Local language keywords (Polish/Finnish as needed)

---

## Phase 5: Huuto.net (Finland - Auction Site)

### Site Information
- **URL**: https://www.huuto.net
- **Country**: Finland 🇫🇮
- **Type**: Online auction marketplace (similar to eBay)
- **Language**: Finnish (+ some English)
- **Market**: General goods via auction/buy-now

### Test Plan

#### Step 1: Initial Reconnaissance (curl)
```bash
# Homepage check
curl -I https://www.huuto.net/

# Search page check
curl -s "https://www.huuto.net/haku?words=iphone" | head -200

# Alternative search patterns
curl -s "https://www.huuto.net/kohteet?q=iphone" | head -200
```

**Expected**: Check for:
- HTTP status codes
- Cloudflare headers
- Finnish content presence
- Redirect behavior

#### Step 2: Puppeteer Multi-Pattern Test
Create `test-huuto-access.js` with tests for:

1. Homepage: `https://www.huuto.net/`
2. Search pattern 1: `/haku?words=iphone`
3. Search pattern 2: `/kohteet?q=iphone`
4. Category search: `/haku?words=iphone&category=electronics`
5. Finnish keyword: `/haku?words=matkapuhelin` (mobile phone)
6. Buy-now filter: Check if "Buy Now" vs "Auction" filtering available

**Key Checks**:
- Turnstile presence (text: "Checking your browser")
- Auction listings vs Buy Now listings
- Listing count indicators
- Pagination structure

#### Step 3: HTML Structure Analysis (if accessible)
Look for:
- **Listing containers**: `div.auction-item`, `article`, or similar
- **Titles**: Auction titles
- **Prices**: Current bid, Buy Now price, starting price
- **Images**: Auction item images
- **End times**: Auction end timestamps
- **Seller info**: User ratings, seller names

**Special Considerations**:
- Auction sites may have real-time bid updates (JavaScript-heavy)
- Mix of auction + buy-now listings
- Time-sensitive data (auction end times)

#### Step 4: Documentation
If accessible, create `huuto-findings.md`:
- Working URL patterns
- Listing selectors
- Auction vs Buy Now differentiation
- Price structure (current bid, buy now, reserve)
- Recommendation: Proceed/Conditional/Block

---

## Phase 6: OLX.pl (Poland - General Classifieds)

### Site Information
- **URL**: https://www.olx.pl
- **Country**: Poland 🇵🇱
- **Type**: General classifieds marketplace (Very popular in Poland)
- **Language**: Polish
- **Market**: One of the largest classifieds sites in Poland

### Test Plan

#### Step 1: Initial Reconnaissance (curl)
```bash
# Homepage check
curl -I https://www.olx.pl/

# Search page check
curl -s "https://www.olx.pl/oferty/q-iphone/" | head -200

# Alternative patterns
curl -s "https://www.olx.pl/elektronika/q-iphone/" | head -200
curl -s "https://www.olx.pl/oferty/iphone/" | head -200
```

**Expected**: Check for:
- HTTP status codes
- Cloudflare/bot protection
- Polish language content
- Site structure (OLX has specific URL patterns)

#### Step 2: Puppeteer Multi-Pattern Test
Create `test-olx-access.js` with tests for:

1. Homepage: `https://www.olx.pl/`
2. Search pattern 1: `/oferty/q-iphone/`
3. Search pattern 2: `/elektronika/q-iphone/`
4. Location filter: `/warszawa/q-iphone/` (Warsaw)
5. Polish keyword: `/oferty/q-telefon/` (phone)
6. Price sort: Check if price sorting available in URL

**Key Checks**:
- Turnstile/Cloudflare challenge
- Listing count ("Znaleziono X ogłoszeń" - "Found X ads")
- Featured/promoted listings vs regular
- Login walls or view limits

#### Step 3: HTML Structure Analysis (if accessible)
Look for:
- **Listing containers**: `div[data-cy="l-card"]`, `article`, `div.offer`
- **Titles**: Listing titles
- **Prices**: Price in PLN (złoty)
- **Images**: Thumbnail images
- **Location**: City/region
- **Featured badges**: Promoted/highlighted listings

**Special Considerations**:
- OLX is known for bot protection (may have challenges)
- Large site = robust anti-scraping measures
- May require user-agent rotation

#### Step 4: Documentation
If accessible, create `olx-findings.md`

---

## Phase 7: Allegro Lokalnie (Poland - Local Classifieds)

### Site Information
- **URL**: https://allegrolokalnie.pl
- **Country**: Poland 🇵🇱
- **Type**: Local classifieds (sister site of Allegro marketplace)
- **Language**: Polish
- **Market**: Local pickup/sale focus (like Facebook Marketplace)

### Test Plan

#### Step 1: Initial Reconnaissance (curl)
```bash
# Homepage check
curl -I https://allegrolokalnie.pl/

# Search patterns
curl -s "https://allegrolokalnie.pl/oferty?search=iphone" | head -200
curl -s "https://allegrolokalnie.pl/oferty/iphone" | head -200
curl -s "https://allegrolokalnie.pl/kategoria/elektronika?search=iphone" | head -200
```

**Expected**: Check for:
- HTTP status codes
- Allegro's anti-bot measures
- Relationship to main Allegro site
- Polish content presence

#### Step 2: Puppeteer Multi-Pattern Test
Create `test-allegro-lokalnie-access.js` with tests for:

1. Homepage: `https://allegrolokalnie.pl/`
2. Search pattern 1: `/oferty?search=iphone`
3. Search pattern 2: `/oferty/iphone`
4. Category search: `/kategoria/elektronika?search=iphone`
5. Location filter: `/warszawa/oferty?search=iphone`
6. Polish keyword: `/oferty?search=telefon`

**Key Checks**:
- Turnstile/bot protection (Allegro is security-conscious)
- Login requirements
- Listing visibility without account
- Geographic filtering

#### Step 3: HTML Structure Analysis (if accessible)
Look for:
- **Listing containers**: Modern React-based structure likely
- **Titles**: Item titles
- **Prices**: PLN prices
- **Images**: Product images
- **Location**: Pickup locations (critical for "lokalnie" = local)
- **Seller info**: User profiles

**Special Considerations**:
- May share infrastructure with main Allegro.pl
- Could have strict rate limiting
- May require authentication for full access
- Local pickup focus = location data important

#### Step 4: Documentation
If accessible, create `allegro-lokalnie-findings.md`

---

## Phase 8: Sprzedajemy.pl (Poland - General Classifieds)

### Site Information
- **URL**: https://sprzedajemy.pl
- **Country**: Poland 🇵🇱
- **Type**: General classifieds marketplace
- **Language**: Polish
- **Market**: Smaller than OLX but still significant

### Test Plan

#### Step 1: Initial Reconnaissance (curl)
```bash
# Homepage check
curl -I https://sprzedajemy.pl/

# Search patterns
curl -s "https://sprzedajemy.pl/szukaj?q=iphone" | head -200
curl -s "https://sprzedajemy.pl/search?query=iphone" | head -200
curl -s "https://sprzedajemy.pl/elektronika/iphone" | head -200
```

**Expected**: Check for:
- HTTP status codes
- Site availability (smaller sites may have downtime)
- Polish language
- Search functionality

#### Step 2: Puppeteer Multi-Pattern Test
Create `test-sprzedajemy-access.js` with tests for:

1. Homepage: `https://sprzedajemy.pl/`
2. Search pattern 1: `/szukaj?q=iphone`
3. Search pattern 2: `/search?query=iphone`
4. Category filter: `/elektronika?q=iphone`
5. Polish keyword: `/szukaj?q=telefon`
6. Price range: Check if price filters available

**Key Checks**:
- Turnstile/Cloudflare protection
- Listing density (smaller site = fewer listings?)
- Search result count
- Modern vs legacy site structure

#### Step 3: HTML Structure Analysis (if accessible)
Look for:
- **Listing containers**: Standard article/div structures
- **Titles**: Listing titles
- **Prices**: PLN amounts
- **Images**: Listing images
- **Dates**: Posted dates
- **Location**: City/region

**Special Considerations**:
- Smaller site = may be easier to scrape (less anti-bot investment)
- But also = may have less stable infrastructure
- Check if site is actively maintained

#### Step 4: Documentation
If accessible, create `sprzedajemy-findings.md`

---

## Phase 9: Oikotie.fi (Finland - Optional Multi-Category)

### Site Information
- **URL**: https://www.oikotie.fi
- **Country**: Finland 🇫🇮
- **Type**: Multi-category marketplace (housing, cars, jobs, general items)
- **Language**: Finnish (+ some Swedish/English)
- **Market**: Major Finnish classified site (more than just items)
- **Note**: Marked as "optional later" in SPEC.md

### Test Plan

#### Step 1: Initial Reconnaissance (curl)
```bash
# Homepage check
curl -I https://www.oikotie.fi/

# General items search (if exists)
curl -s "https://www.oikotie.fi/ilmoitukset?q=iphone" | head -200
curl -s "https://www.oikotie.fi/tavarat?q=iphone" | head -200

# Check what sections exist
curl -s "https://www.oikotie.fi/" | grep -i "ilmoitukset\|tavarat\|myydaan"
```

**Expected**: Check for:
- HTTP status codes
- Site structure (housing-focused? or general items too?)
- Finnish content
- Whether "items for sale" section exists and is accessible

#### Step 2: Puppeteer Multi-Pattern Test
Create `test-oikotie-access.js` with tests for:

1. Homepage: `https://www.oikotie.fi/`
2. Items search (if exists): `/ilmoitukset?q=iphone`
3. Alternative pattern: `/tavarat?q=iphone`
4. Finnish keyword: `/ilmoitukset?q=matkapuhelin`
5. Category filter: Electronics category (if exists)

**Key Checks**:
- Whether general items section exists (may be primarily housing/cars)
- Turnstile protection
- Content accessibility
- Item listing format

#### Step 3: HTML Structure Analysis (if accessible)
Look for:
- **Listing containers**: Item cards
- **Titles**: Item names
- **Prices**: EUR amounts
- **Images**: Item photos
- **Categories**: What categories are available?

**Special Considerations**:
- Oikotie is primarily known for housing/real estate in Finland
- May not have robust general classifieds section
- If items section is small/limited, may not be worth implementing
- Lower priority (marked optional in SPEC)

#### Step 4: Documentation
If accessible and viable, create `oikotie-findings.md`  
If not viable for general items, document why in findings.

---

## Testing Execution Order

### Recommended Sequence

**Priority Order** (based on market size & likelihood):

1. **Phase 6: OLX.pl** (Largest Polish site - HIGH priority)
2. **Phase 5: Huuto.net** (Established Finnish auction site)
3. **Phase 7: Allegro Lokalnie** (Popular Polish local classifieds)
4. **Phase 8: Sprzedajemy.pl** (Smaller but potentially easier)
5. **Phase 9: Oikotie.fi** (Optional - check if viable for general items)

### Alternative Sequence (Geographic):

**Finland First**:
1. Phase 5: Huuto.net
2. Phase 9: Oikotie.fi

**Poland Next**:
3. Phase 6: OLX.pl
4. Phase 7: Allegro Lokalnie
5. Phase 8: Sprzedajemy.pl

---

## Polish Language Keywords (Useful for Testing)

| English | Polish | Usage |
|---------|--------|-------|
| phone | telefon | Search query |
| mobile phone | telefon komórkowy | Search query |
| laptop | laptop | Search query |
| electronics | elektronika | Category |
| for sale | sprzedam | Listing type |
| price | cena | Filter |
| location | lokalizacja | Filter |
| new | nowy | Condition |
| used | używany | Condition |
| Warsaw | Warszawa | City |

---

## Success Metrics & Decision Points

### After Each Phase

**If Accessible (✅)**:
- Create findings documentation
- Document HTML structure
- Estimate implementation effort
- Add to "ready to implement" list

**If Conditional (⚠️)**:
- Document limitations
- Decide if worth investigating further
- Lower priority vs fully accessible sites

**If Blocked (❌)**:
- Document blocking mechanism (Turnstile, etc.)
- Mark as not viable
- Move to next phase

### After All 5 Phases Complete

**Evaluate**:
- How many sites are accessible? (Target: 2+ to justify Polish market)
- Is it worth adding Polish market coverage?
- Which Finnish site is better (Tori vs Huuto)?
- Should Oikotie be pursued if general items section is limited?

---

## Expected Challenges

### Finland Sites
- **Huuto.net**: Auction sites may have complex JavaScript for real-time bidding
- **Oikotie.fi**: May not have robust general items section

### Poland Sites
- **OLX.pl**: Large site = likely has strong anti-scraping measures
- **Allegro Lokalnie**: Allegro family = potentially sophisticated protection
- **Sprzedajemy.pl**: Unknown - could be easy or difficult

### General Challenges
- Polish language = need translation for queries/categories
- New markets = unfamiliar URL patterns
- Unknown protection levels (could hit more Turnstile walls)

---

## Contingency Plans

**If all Poland sites blocked**:
- Focus on Finnish expansion only
- Consider other markets (Sweden, Germany, etc.)

**If all Finland sites blocked/limited**:
- Tori.fi already works (Phase 4) - sufficient Finnish coverage
- Focus on Polish market expansion

**If 3+ of 5 sites blocked**:
- Re-evaluate expansion strategy
- Focus on optimizing existing sources (Latvia + Tori + Vinted)
- Consider API-based solutions

---

## Success Scenarios

### Best Case (4-5 accessible)
- Implement all accessible sites
- Strong Poland coverage (2-3 sources)
- Good Finland coverage (Tori + Huuto/Oikotie)
- Total: 6-7 marketplace sources

### Good Case (2-3 accessible)
- Add 1-2 Polish sources
- Supplement Finland with 1 more source
- Total: 4-5 marketplace sources

### Acceptable Case (1-2 accessible)
- Add strongest 1-2 sources
- Focus on quality over quantity
- Total: 4 marketplace sources

### Worst Case (0 accessible)
- Stick with current viable sources:
  - Latvia: SS.lv, Andele (2)
  - Lithuania: Vinted.lt (1)
  - Finland: Tori.fi (1)
- Total: 4 sources across 3 countries = still good coverage

---

## Timeline Estimate

**Per Phase**: 30-60 minutes (depending on complexity)

- curl tests: 5-10 min
- Puppeteer script creation: 10-15 min
- Test execution & analysis: 10-20 min
- Findings documentation (if accessible): 15-20 min

**Total for 5 phases**: 2.5 - 5 hours

**Recommended**: Execute 1-2 phases per session to maintain focus and quality.

---

## Output Files (Expected)

### Test Scripts
- `test-huuto-access.js`
- `test-olx-access.js`
- `test-allegro-lokalnie-access.js`
- `test-sprzedajemy-access.js`
- `test-oikotie-access.js`

### HTML Samples (if accessible)
- `huuto-search-sample.html`
- `olx-search-sample.html`
- `allegro-lokalnie-search-sample.html`
- `sprzedajemy-search-sample.html`
- `oikotie-search-sample.html`

### Findings Documentation (if accessible)
- `huuto-findings.md`
- `olx-findings.md`
- `allegro-lokalnie-findings.md`
- `sprzedajemy-findings.md`
- `oikotie-findings.md`

### Summary Update
- Update `availableplatforms.md` with Phase 2 results

---

## Ready to Execute

This plan is ready for implementation. Start with **Phase 6 (OLX.pl)** as the highest priority, or choose **Phase 5 (Huuto.net)** if you prefer to complete Finland first.

Each phase is independent and can be executed in any order based on priority or preference.
