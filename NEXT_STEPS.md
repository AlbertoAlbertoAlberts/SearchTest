# Next Steps - Marketplace Aggregator Development Plan

**Status:** Planning Phase  
**Last Updated:** 27 December 2025  
**Current State:** Frontend complete, 1 adapter implemented (SS.com)

---

## Overview

The frontend is now complete with all core features implemented. The next steps focus on:
1. Expanding marketplace coverage (more adapters)
2. Improving data quality and reliability
3. Adding advanced features
4. Testing and optimization
5. Deployment preparation

---

## Phase G: SS.com Adapter Validation & Fixes

**Goal:** Ensure the existing SS.com adapter works correctly with real data

### Tasks:
1. **Test SS.com Adapter with Real Searches**
   - Test various search queries (electronics, furniture, vehicles, etc.)
   - Verify URL construction is correct
   - Ensure parsing extracts all required fields
   - Check error handling for malformed pages

2. **Fix SS.com URL Pattern**
   - Current implementation may have incorrect URL structure
   - Verify against actual SS.com search URLs
   - Test with Latvian and English interfaces

3. **Improve Data Extraction**
   - Add fallback parsing for missing fields
   - Extract images if available (`hasImage: true/false`)
   - Parse condition more robustly
   - Handle price formats (€, EUR, numbers)

4. **Add Pagination Support**
   - Currently only fetches first page
   - Implement multi-page scraping (configurable limit)
   - Add page parameter to search function

5. **Error Handling**
   - Handle network timeouts gracefully
   - Detect blocked/rate-limited requests
   - Add retry logic with exponential backoff

**Deliverables:**
- ✅ Fully functional SS.com adapter
- ✅ Comprehensive error handling
- ✅ Documentation of SS.com data structure

---

## Phase H: Core Baltic Adapters (Priority Markets)

**Goal:** Implement adapters for the most popular Baltic marketplaces

### H1: Okidoki (Estonia)
**Site:** https://www.okidoki.ee  
**Priority:** HIGH (2nd largest Baltic marketplace)

**Tasks:**
- Create `lib/adapters/okidoki.js`
- Implement search function
- Parse listings (title, price, location, date, condition)
- Handle Estonian language content
- Add to adapter registry

### H2: Tori (Finland)
**Site:** https://www.tori.fi  
**Priority:** HIGH (Finland's #1 marketplace)

**Tasks:**
- Create `lib/adapters/tori.js`
- Handle Finnish language
- Parse Tori's specific structure
- Extract contact info if public
- Add to adapter registry

### H3: Skelbiu (Lithuania)
**Site:** https://www.skelbiu.lt  
**Priority:** HIGH (Lithuania's largest)

**Tasks:**
- Create `lib/adapters/skelbiu.js`
- Handle Lithuanian language
- Parse category-specific data
- Support both private and business listings
- Add to adapter registry

**Deliverables:**
- ✅ 3 new working adapters (total: 4)
- ✅ Multi-language support (LV, EE, FI, LT)
- ✅ Consistent data normalization across sources

---

## Phase I: Enhanced Data Quality

**Goal:** Improve reliability and richness of scraped data

### Tasks:
1. **Image Support**
   - Extract first/main image URL from listings
   - Store in `imageUrl` field
   - Update frontend to display actual images
   - Add image loading/error states
   - Implement lazy loading for images

2. **Better Date Parsing**
   - Parse relative dates ("2 days ago", "today", "vakar")
   - Convert to ISO format for sorting
   - Handle multiple language formats

3. **Location Extraction**
   - Add `location` field to schema
   - Extract city/region from listings
   - Display location in cards
   - Add location filter to sidebar

4. **Condition Normalization**
   - Map various condition strings to standard values:
     - "jauns" → "New"
     - "labs stāvoklis" → "Good as New"
     - "lietots" → "Used"
   - Handle multiple languages

5. **Category Detection**
   - Extract category from listing
   - Add `category` field to schema
   - Enable category filtering

6. **Seller Information**
   - Extract seller name if available
   - Detect business vs private seller
   - Add `sellerType` field

**Deliverables:**
- ✅ Richer listing data
- ✅ Better filtering capabilities
- ✅ Improved user experience with images

---

## Phase J: Polish & Nordic Adapters

**Goal:** Expand to Polish and additional Nordic markets

### J1: OLX Poland
**Site:** https://www.olx.pl  
**Priority:** MEDIUM (large market)

### J2: Allegro Lokalnie
**Site:** https://allegrolokalnie.pl  
**Priority:** MEDIUM

### J3: Huuto.net (Finland)
**Site:** https://www.huuto.net  
**Priority:** LOW (auction-focused)

### J4: Vinted Lithuania
**Site:** https://www.vinted.lt  
**Priority:** LOW (clothing-specific)

**Deliverables:**
- ✅ 4 additional adapters (total: 8)
- ✅ Polish language support

---

## Phase K: Advanced Features

**Goal:** Add features that improve user experience and utility

### K1: Saved Searches
- Store searches in localStorage
- Quick access to frequent searches
- "My Searches" page/dropdown

### K2: Price Alerts
- User sets target price for search
- Email/notification when match found
- Requires backend service + database

### K3: Comparison View
- Select multiple listings
- Side-by-side comparison table
- Highlight differences

### K4: Recently Viewed
- Track viewed listings
- Show in sidebar or separate page
- Persist in localStorage

### K5: Export Results
- Export to CSV/Excel
- Export to PDF
- Copy to clipboard

### K6: Advanced Search
- Multiple keywords with AND/OR
- Exclude terms
- Date range filtering
- Seller type filtering

### K7: Map View
- Display listings on map
- Filter by geographic area
- Requires coordinates from listings

**Deliverables:**
- ✅ User-centric features
- ✅ Improved workflow efficiency
- ✅ Better data management

---

## Phase L: Performance & Reliability

**Goal:** Optimize for speed, reliability, and scale

### L1: Caching Strategy
- Implement Redis/in-memory cache
- Cache search results for 5-15 minutes
- Reduce redundant scraping
- Add cache headers

### L2: Rate Limiting
- Prevent abuse of API
- Implement per-IP rate limits
- Add API key system (optional)

### L3: Background Jobs
- Move scraping to background workers
- Use queue system (Bull, BullMQ)
- Support async job status checking
- Webhook notifications on completion

### L4: Database Integration
- Store listings in database
- Enable full-text search
- Historical price tracking
- Analytics and trends

### L5: Error Monitoring
- Integrate Sentry or similar
- Track adapter failures
- Alert on high error rates
- Dashboard for monitoring

### L6: Performance Optimization
- Server-side rendering (SSR)
- Static generation where possible
- Bundle size optimization
- Image optimization (Next.js Image)

**Deliverables:**
- ✅ Sub-second response times
- ✅ Reliable service (99%+ uptime)
- ✅ Scalable architecture

---

## Phase M: Testing & Quality Assurance

**Goal:** Ensure code quality and reliability

### M1: Unit Tests
- Test adapter parsing functions
- Test normalization logic
- Test filter helpers
- Target: 80%+ coverage

### M2: Integration Tests
- Test API endpoints
- Test adapter orchestrator
- Mock external HTTP requests

### M3: E2E Tests
- Test complete user flows
- Search → Filter → Sort → View
- Use Playwright or Cypress

### M4: Accessibility Testing
- Automated a11y testing
- Manual screen reader testing
- Keyboard navigation testing
- Color contrast validation

### M5: Cross-Browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome)
- Test responsive design

### M6: Load Testing
- Simulate concurrent users
- Test API under load
- Identify bottlenecks

**Deliverables:**
- ✅ Comprehensive test suite
- ✅ CI/CD pipeline
- ✅ Quality metrics dashboard

---

## Phase N: Deployment & Operations

**Goal:** Deploy to production and maintain service

### N1: Hosting Setup
- **Frontend Options:**
  - Vercel (recommended for Next.js)
  - Netlify
  - AWS Amplify
  
- **Backend/API:**
  - Vercel (serverless functions)
  - Railway
  - Render
  - AWS Lambda + API Gateway

- **Database (if needed):**
  - Railway PostgreSQL
  - Supabase
  - PlanetScale

### N2: Domain & DNS
- Register domain name
- Configure DNS
- SSL certificate (automatic with Vercel)

### N3: Environment Configuration
- Production environment variables
- Secrets management
- API keys for services

### N4: Monitoring & Analytics
- Set up Google Analytics or Plausible
- Error monitoring (Sentry)
- Uptime monitoring (UptimeRobot)
- Performance monitoring

### N5: Documentation
- User guide
- API documentation
- Deployment guide
- Contributing guide

### N6: Legal & Compliance
- Terms of Service
- Privacy Policy
- Cookie policy
- GDPR compliance (if applicable)
- Scraping legality review

**Deliverables:**
- ✅ Live production site
- ✅ Monitoring and alerts
- ✅ Complete documentation

---

## Phase O: Marketing & Growth (Optional)

**Goal:** Attract users and grow the platform

### O1: SEO Optimization
- Meta tags and descriptions
- Sitemap generation
- Schema.org markup
- Social media cards

### O2: Content Strategy
- Blog about marketplace tips
- Buying guides
- Market insights from data

### O3: Social Media Presence
- Twitter/X account
- Reddit presence
- Facebook group

### O4: Community Building
- Discord server
- Feedback system
- Feature requests voting

**Deliverables:**
- ✅ Growing user base
- ✅ Active community
- ✅ Brand presence

---

## Priority Roadmap

### Immediate (Next 1-2 weeks)
1. **Phase G**: Fix and validate SS.com adapter
2. **Phase H**: Implement 3 core Baltic adapters

### Short Term (2-4 weeks)
3. **Phase I**: Enhanced data quality (images, location)
4. **Phase J**: Polish & Nordic adapters

### Medium Term (1-2 months)
5. **Phase K**: Advanced features (saved searches, comparison)
6. **Phase L**: Performance & reliability improvements

### Long Term (2+ months)
7. **Phase M**: Comprehensive testing
8. **Phase N**: Production deployment
9. **Phase O**: Marketing & growth

---

## Technical Debt to Address

1. **URL Sync Issue**: Fix double URL update in pages/index.js
2. **Mobile Responsiveness**: Test on more devices
3. **Error Recovery**: Better handling of partial failures
4. **Type Safety**: Consider adding TypeScript
5. **Code Documentation**: Add JSDoc comments throughout
6. **Bundle Size**: Analyze and optimize
7. **API Rate Limiting**: Prevent abuse

---

## Success Metrics

### Technical KPIs
- API response time < 2s (90th percentile)
- Adapter success rate > 95%
- Frontend load time < 1s
- Test coverage > 80%

### Product KPIs
- Number of supported marketplaces: 8+
- Listings returned per search: 50+
- User engagement (searches per session)
- Return user rate

### Business KPIs (if monetized)
- Active users (DAU/MAU)
- User retention rate
- Conversion to paid features (if applicable)

---

## Decision Points

### Questions to Answer:
1. **Monetization?** Free, freemium, ads, subscription?
2. **User Accounts?** Anonymous, optional accounts, required accounts?
3. **Data Storage?** Ephemeral (API-only) or persistent (database)?
4. **Mobile App?** Web-only or native apps later?
5. **API Access?** Public API for developers?

---

## Resources Needed

### Development
- Time commitment: 10-20 hours/week
- Testing devices (phones, tablets)
- Premium hosting if scaling

### Services (Costs)
- Domain name: ~$10-15/year
- Hosting: $0-50/month (starts free)
- Monitoring: $0-20/month (Sentry free tier)
- Database: $0-25/month (starts free)

**Estimated Monthly Cost:** $0-100 (can start free)

---

## Risk Management

### Potential Risks:
1. **Legal Risk**: Scraping may violate ToS
   - **Mitigation**: Review each site's ToS, add robots.txt check, rate limit

2. **Technical Risk**: Sites change structure
   - **Mitigation**: Automated tests, monitoring, graceful failures

3. **Performance Risk**: Scraping is slow
   - **Mitigation**: Caching, parallel requests, background jobs

4. **Competition**: Similar services exist
   - **Mitigation**: Focus on UX, unique features, niche markets

5. **Maintenance Burden**: Many adapters to maintain
   - **Mitigation**: Good abstractions, automated testing, community contributions

---

## Next Immediate Action

**Start with Phase G: SS.com Adapter Validation**

1. Test current implementation with real searches
2. Identify and document issues
3. Fix URL construction and parsing
4. Add comprehensive error handling
5. Verify data quality

Once SS.com works reliably, move to Phase H and implement the core Baltic adapters.

---

**End of Plan**
