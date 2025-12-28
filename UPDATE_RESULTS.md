# Update Results Display - Implementation Plan

**Status:** Planning  
**Created:** 28 December 2025  
**Goal:** Enhance listing cards with images and description previews

---

## Overview

Currently, listing cards show:
- ✅ Title
- ✅ Price
- ✅ Condition
- ✅ Date added
- ✅ "Has Description" / "No Description" indicator
- ❌ No images
- ❌ No description preview

**Target:** Show actual content instead of indicators

---

## Phase 1: Display First Image

### Current State
- Adapter fetches images but doesn't return them to frontend
- `hasImage` boolean is returned
- Image URLs are in `images` array but not in normalized schema

### Changes Needed

#### 1.1: Update Data Schema
**File:** `SPEC.md`

Add to Listing schema:
```javascript
{
  // ... existing fields
  imageUrl: string | null,        // First image URL
  hasImage: boolean,              // Keep for compatibility
}
```

#### 1.2: Update Normalization
**File:** `lib/normalize.js`

Update `normalizeListing()` to extract first image:
```javascript
imageUrl: raw.images?.[0] || raw.imageUrl || null,
hasImage: Boolean(raw.images?.[0] || raw.imageUrl),
```

#### 1.3: Update ListingCard Component
**File:** `components/ListingCard.js`

Replace placeholder image with actual image:
```jsx
{imageUrl ? (
  <img 
    src={imageUrl} 
    alt={title}
    className={styles.listingImage}
    loading="lazy"
    onError={(e) => e.target.src = '/placeholder.png'}
  />
) : (
  <div className={styles.imagePlaceholder}>
    <span className={styles.imageIcon}>📷</span>
  </div>
)}
```

#### 1.4: Add Image Styles
**File:** `components/ListingCard.module.css`

```css
.listingImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.imagePlaceholder {
  /* Keep existing styles */
}
```

---

## Phase 2: Extract First Sentence/Line of Description

### Challenge
Extract meaningful first sentence that:
- Ends at natural break (sentence end)
- Handles multiple languages (LV, RU, EN)
- Works when no punctuation exists
- Isn't too long or too short

### Sentence Detection Strategy

#### 2.1: Sentence Ending Patterns

**Primary delimiters** (in order of preference):
1. Period followed by space: `. `
2. Exclamation mark: `! `
3. Question mark: `? `
4. Period followed by newline: `.\n`
5. Double newline: `\n\n` (paragraph break)
6. Newline: `\n` (single line)

**Fallback strategy** (if no delimiter found):
1. If text < 150 chars: Use entire text
2. If text > 150 chars: Cut at last space before 150 chars, add "..."

#### 2.2: Smart Extraction Function

**File:** `lib/textHelpers.js` (new file)

```javascript
/**
 * Extracts the first sentence or line from text intelligently
 * @param {string} text - Full text to extract from
 * @param {number} maxLength - Maximum characters (default: 150)
 * @returns {string} - First sentence or truncated text
 */
export function extractFirstSentence(text, maxLength = 150) {
  if (!text || typeof text !== 'string') return '';
  
  // Clean up text
  const cleaned = text.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length === 0) return '';
  
  // Try to find sentence ending
  const sentenceEndings = [
    { pattern: /\.\s+[A-ZА-Я]/, delimiter: '. ' },  // Period + space + capital
    { pattern: /\!\s+/, delimiter: '! ' },          // Exclamation
    { pattern: /\?\s+/, delimiter: '? ' },          // Question
    { pattern: /\.\n/, delimiter: '.\n' },          // Period + newline
    { pattern: /\n\n/, delimiter: '\n\n' },         // Paragraph break
    { pattern: /\n/, delimiter: '\n' },             // Single newline
  ];
  
  // Try each pattern
  for (const { pattern, delimiter } of sentenceEndings) {
    const match = cleaned.search(pattern);
    if (match !== -1 && match < maxLength) {
      // Found a sentence ending within maxLength
      const sentence = cleaned.substring(0, match + delimiter.trimEnd().length);
      if (sentence.length >= 20) { // Minimum meaningful length
        return sentence;
      }
    }
  }
  
  // No sentence ending found - use fallback
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate at last word boundary before maxLength
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) { // At least 70% of maxLength
    return truncated.substring(0, lastSpace) + '...';
  }
  
  // No good word boundary - hard cut
  return truncated + '...';
}

/**
 * Extract first sentence from full description
 * Wrapper function for adapter usage
 */
export function getDescriptionPreview(fullDescription) {
  if (!fullDescription) return null;
  
  const preview = extractFirstSentence(fullDescription, 150);
  
  // Return null if too short (probably not a real sentence)
  if (preview.length < 20) return null;
  
  return preview;
}
```

#### 2.3: Update Adapter to Extract Description Preview

**File:** `lib/adapters/ss.js`

```javascript
import { getDescriptionPreview } from '../textHelpers.js';

// In fetchListingDetails():
const descriptionPreview = getDescriptionPreview(description);

return {
  hasDescription: description.length > 100,
  fullDescription: description,
  descriptionPreview: descriptionPreview,  // NEW
  images: images,
  // ...
};
```

#### 2.4: Update Schema

**File:** `SPEC.md`

Add to Listing schema:
```javascript
{
  // ... existing fields
  descriptionPreview: string | null,  // First sentence/line of description
  hasDescription: boolean,            // Keep for filtering
  fullDescription: string,            // Full text (not shown in card)
}
```

#### 2.5: Update Normalization

**File:** `lib/normalize.js`

```javascript
descriptionPreview: raw.descriptionPreview || null,
hasDescription: Boolean(raw.hasDescription || raw.fullDescription?.length > 100),
```

---

## Phase 3: Update ListingCard to Display Preview

### 3.1: Replace "Has Description" Indicator

**File:** `components/ListingCard.js`

**Current:**
```jsx
<div className={styles.metadataItem}>
  <CheckmarkIcon checked={hasDescription} />
  <span>{hasDescription ? "Has Description" : "No Description"}</span>
</div>
```

**New:**
```jsx
{descriptionPreview && (
  <div className={styles.descriptionPreview}>
    <p>{descriptionPreview}</p>
  </div>
)}
```

### 3.2: Update Layout

**Current layout:**
```
┌────────┐  Title                Price
│ Image  │  ✓ Condition
│        │  ✓ Date added
└────────┘  ✓ Has Description
            Source: SS.lv
```

**New layout:**
```
┌────────┐  Title                Price
│ Image  │  ✓ Condition
│ (real) │  ✓ Date added
└────────┘  "First sentence of description..."
            Source: SS.lv
```

### 3.3: Add Description Preview Styles

**File:** `components/ListingCard.module.css`

```css
.descriptionPreview {
  margin-top: 8px;
  padding: 10px 12px;
  background: var(--bg-gray, #f9fafb);
  border-left: 3px solid var(--primary, #2563eb);
  border-radius: 6px;
}

.descriptionPreview p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary, #6b7280);
  font-style: italic;
}
```

---

## Phase 4: Testing Strategy

### 4.1: Test Cases

**Description extraction:**
1. ✅ Normal sentence with period: "Šis ir jauns produkts."
2. ✅ Multiple sentences: "First. Second. Third." → Show only "First."
3. ✅ No punctuation: "This is a description without punctuation" → Show first 150 chars
4. ✅ Very long first sentence: Truncate at word boundary
5. ✅ Short description (<20 chars): Don't show preview
6. ✅ Empty/null description: Show nothing
7. ✅ Multi-line without punctuation: Break at first newline
8. ✅ Cyrillic text: "Это новый продукт. Отличное состояние." → "Это новый продукт."
9. ✅ Mixed content: HTML/special chars should be cleaned

**Image display:**
1. ✅ Listing with image: Display actual image
2. ✅ Listing without image: Show placeholder
3. ✅ Image load error: Fallback to placeholder
4. ✅ Multiple images: Show only first
5. ✅ Image lazy loading: Works on scroll

### 4.2: Manual Testing Checklist

- [ ] Search for "airpods" - verify images load
- [ ] Search for "macbook" - verify descriptions display
- [ ] Search for items without images - verify placeholders
- [ ] Test with long descriptions - verify truncation
- [ ] Test with short descriptions - verify handling
- [ ] Check mobile responsiveness
- [ ] Verify performance with 30+ results

---

## Phase 5: Performance Considerations

### 5.1: Image Optimization

**Considerations:**
- Lazy loading already implemented (`loading="lazy"`)
- Add fallback for broken images
- Consider adding image dimensions to prevent layout shift
- Don't fetch full-size images if SS.com provides thumbnails

### 5.2: Description Processing

**Optimization:**
- Extract preview during scraping (not on every render)
- Cache processed descriptions
- Minimize string operations in components

### 5.3: Network Impact

**Current:** Fetches each listing page (slow but comprehensive)

**Optimization options:**
1. Keep current approach (most accurate)
2. Add caching layer
3. Make detail fetching optional for faster results
4. Implement progressive loading (show basic data first, enhance later)

---

## Implementation Order

### Step 1: Create Text Helper (15 min)
- Create `lib/textHelpers.js`
- Implement `extractFirstSentence()`
- Implement `getDescriptionPreview()`
- Test with various inputs

### Step 2: Update Adapter (10 min)
- Import text helpers
- Extract description preview in `fetchListingDetails()`
- Return `descriptionPreview` field

### Step 3: Update Normalization (5 min)
- Add `imageUrl` extraction
- Add `descriptionPreview` pass-through

### Step 4: Update ListingCard Component (20 min)
- Replace image placeholder with real image
- Replace "Has Description" with preview
- Add new CSS styles
- Handle edge cases (no image, no description)

### Step 5: Update Schema Documentation (5 min)
- Update `SPEC.md` with new fields

### Step 6: Testing (15 min)
- Test with various searches
- Verify images load correctly
- Check description extraction works
- Test edge cases

**Total estimated time: ~70 minutes**

---

## Edge Cases to Handle

### Images
1. ❌ **No image URL**: Show placeholder
2. ❌ **Image 404**: Add `onError` handler → show placeholder
3. ❌ **Image too large**: CSS `object-fit: cover` handles this
4. ❌ **Image wrong aspect ratio**: Fixed container size handles this
5. ❌ **External images blocked**: Can't control, show broken image state

### Descriptions
1. ❌ **Empty description**: Don't show preview section
2. ❌ **Only whitespace**: Clean and validate
3. ❌ **HTML in description**: Need to strip tags (add to text helper)
4. ❌ **Very short (< 20 chars)**: Don't show preview
5. ❌ **No sentence ending in 150 chars**: Truncate at word boundary
6. ❌ **Special characters**: Handle unicode properly
7. ❌ **Multiple languages in one description**: Extract first sentence regardless

### Additional Sentence-End Cases
1. ❌ **Abbreviations**: "Dr. Smith" shouldn't end sentence at "Dr."
2. ❌ **Ellipsis**: "Wait..." is a sentence end
3. ❌ **Emoji**: Handle emoji in text
4. ❌ **URLs**: Don't break at period in URL

---

## Enhanced Text Helper (Handles More Cases)

```javascript
export function extractFirstSentence(text, maxLength = 150) {
  if (!text || typeof text !== 'string') return '';
  
  // Strip HTML tags if present
  const withoutHtml = text.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  const cleaned = withoutHtml.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= maxLength) return cleaned;
  
  // Common abbreviations to ignore (extend as needed)
  const abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Ltd', 'Inc', 'etc', 'approx'];
  
  // Try to find sentence ending
  const patterns = [
    /\.\s+[A-ZА-ЯĀ-Ž]/,  // Period + space + capital letter
    /[!?]\s+/,            // ! or ? followed by space
    /\.\.\.\s*/,          // Ellipsis
    /\n\n/,               // Paragraph break
    /\n/,                 // Line break
  ];
  
  for (const pattern of patterns) {
    const matches = [];
    let match;
    const regex = new RegExp(pattern, 'g');
    
    while ((match = regex.exec(cleaned)) !== null) {
      if (match.index < maxLength) {
        // Check if it's not an abbreviation
        const beforePeriod = cleaned.substring(Math.max(0, match.index - 10), match.index);
        const isAbbreviation = abbreviations.some(abbr => 
          beforePeriod.endsWith(abbr)
        );
        
        if (!isAbbreviation) {
          matches.push(match.index);
        }
      }
    }
    
    if (matches.length > 0) {
      const endIndex = matches[0] + 1; // Include the period/delimiter
      const sentence = cleaned.substring(0, endIndex).trim();
      if (sentence.length >= 20) {
        return sentence;
      }
    }
  }
  
  // Fallback: truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  
  return truncated.trim() + '...';
}
```

---

## Success Criteria

✅ **Images:**
- [ ] Real images display when available
- [ ] Placeholders show when no image
- [ ] Images load lazily
- [ ] Broken images handled gracefully

✅ **Description Previews:**
- [ ] First sentence extracted correctly
- [ ] Handles Latvian, Russian, English
- [ ] Truncates long sentences intelligently
- [ ] Doesn't break in middle of word
- [ ] Cleans HTML if present
- [ ] Skips abbreviations when detecting sentence end

✅ **UI/UX:**
- [ ] Cards look better with images
- [ ] Description previews are readable
- [ ] Layout doesn't break with long/short content
- [ ] Mobile responsive
- [ ] Performance acceptable (< 3s page load)

✅ **Data Flow:**
- [ ] Adapter extracts data correctly
- [ ] Normalization preserves data
- [ ] Frontend receives and displays properly

---

## Future Enhancements (Not in This Update)

- **Image thumbnails**: Use thumbnail URLs if SS.com provides them
- **Multiple images**: Carousel/gallery view
- **Full description modal**: Click to expand
- **Image zoom**: Click to view full size
- **Description formatting**: Preserve some formatting (lists, bold)
- **Read more**: Expand to show full description inline

---

## Rollback Plan

If issues occur:
1. Keep `hasDescription` boolean display as fallback
2. Keep placeholder images if real images cause problems
3. Feature flags: `SHOW_IMAGES=true`, `SHOW_DESCRIPTION_PREVIEW=true`

---

**End of Plan**
