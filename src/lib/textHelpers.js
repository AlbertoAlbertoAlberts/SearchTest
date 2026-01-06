/**
 * Text processing utilities for extracting and formatting content.
 */

/**
 * Extracts the first sentence or line from text intelligently.
 * Handles multiple languages (LV, RU, EN) and various text formats.
 * 
 * @param {string} text - Full text to extract from
 * @param {number} maxLength - Maximum characters (default: 150)
 * @returns {string} - First sentence or truncated text
 */
export function extractFirstSentence(text, maxLength = 150) {
  if (!text || typeof text !== 'string') return '';
  
  // Strip HTML tags if present
  const withoutHtml = text.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  const cleaned = withoutHtml.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length === 0) return '';
  
  // If text is short enough, return as-is
  if (cleaned.length <= maxLength) return cleaned;
  
  // Common abbreviations to ignore (extend as needed)
  const abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Ltd', 'Inc', 'etc', 'approx', 'vs'];
  
  // Try to find sentence ending patterns
  const patterns = [
    { regex: /\.\s+[A-ZА-ЯĀ-Ž]/g, endOffset: 1 },  // Period + space + capital letter
    { regex: /[!?]\s+/g, endOffset: 1 },            // ! or ? followed by space
    { regex: /\.\.\.\s*/g, endOffset: 3 },          // Ellipsis
    { regex: /\n\n/g, endOffset: 0 },               // Paragraph break
    { regex: /\n/g, endOffset: 0 },                 // Line break
  ];
  
  for (const { regex, endOffset } of patterns) {
    const matches = [];
    let match;
    
    while ((match = regex.exec(cleaned)) !== null) {
      if (match.index < maxLength) {
        // Check if it's not an abbreviation (for period patterns)
        if (endOffset === 1 && cleaned[match.index] === '.') {
          const beforePeriod = cleaned.substring(Math.max(0, match.index - 10), match.index);
          const isAbbreviation = abbreviations.some(abbr => 
            beforePeriod.endsWith(abbr)
          );
          
          if (!isAbbreviation) {
            matches.push(match.index);
          }
        } else {
          matches.push(match.index);
        }
      }
    }
    
    if (matches.length > 0) {
      const endIndex = matches[0] + endOffset + 1;
      const sentence = cleaned.substring(0, endIndex).trim();
      
      // Make sure it's long enough to be meaningful
      if (sentence.length >= 20) {
        return sentence;
      }
    }
  }
  
  // Fallback: truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Only break at space if it's at least 70% of maxLength
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  
  // Hard cut if no good word boundary
  return truncated.trim() + '...';
}

/**
 * Extract first line from description, excluding structured fields.
 * Wrapper function for adapter usage with validation.
 * 
 * @param {string} fullDescription - The full description text
 * @returns {string|null} - First line or null if too short/empty
 */
export function getDescriptionPreview(fullDescription) {
  if (!fullDescription) return null;
  
  // Clean up the text
  const cleaned = fullDescription.trim();
  if (!cleaned) return null;
  
  // Split by newlines to get individual lines
  const lines = cleaned.split(/\n+/);
  
  // Find the first line that is actual description (not structured fields)
  // Skip lines that look like "Brand:", "Model:", "Price:", etc.
  const structuredFieldPattern = /^(Brand|Model|Condition|Price|Date|Location|Type|Category|Size|Color|Material)\s*:/i;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Skip structured field lines
    if (structuredFieldPattern.test(trimmedLine)) continue;
    
    // Skip lines that are too short (probably labels)
    if (trimmedLine.length < 20) continue;
    
    // Found a good description line - return just this line
    // If it's too long, truncate at word boundary
    if (trimmedLine.length > 150) {
      const lastSpace = trimmedLine.substring(0, 150).lastIndexOf(' ');
      if (lastSpace > 100) {
        return trimmedLine.substring(0, lastSpace) + '...';
      }
      return trimmedLine.substring(0, 150) + '...';
    }
    
    return trimmedLine;
  }
  
  // If no good line found, return null
  return null;
}
/**
 * Cleans up listing titles by removing breadcrumbs and unnecessary text
 * @param {string} title - Raw title text
 * @param {number} maxLength - Maximum title length (default: 100)
 * @returns {string} - Cleaned title
 */
export function cleanTitle(title, maxLength = 100) {
  if (!title || typeof title !== 'string') return '';
  
  let cleaned = title.trim();
  
  // Remove breadcrumb patterns (text separated by " : " or " / ")
  if (cleaned.includes(' : ')) {
    const parts = cleaned.split(' : ');
    cleaned = parts[parts.length - 1].trim();
  }
  if (cleaned.includes(' / ')) {
    const parts = cleaned.split(' / ');
    cleaned = parts[parts.length - 1].trim();
  }
  
  // Handle concatenated breadcrumb + title (e.g., "iPhone 16Jauns 16, Garantija...")
  // Look for capital letter after lowercase/digit without space
  const concatenatedMatch = cleaned.match(/[a-z\d]([A-ZĀ-Ž][a-zā-ž])/);
  if (concatenatedMatch && concatenatedMatch.index > 0) {
    // Split at the concatenation point (keep the capital letter)
    cleaned = cleaned.substring(concatenatedMatch.index + 1).trim();
  }
  
  // Remove common category prefixes that might remain
  const categoryPatterns = [
    /^(Electronics|Phones|Mobile phones|Apple|Samsung|iPhone|iPad|MacBook|Laptop|Computer|Car|Auto|Furniture|Clothing|Shoes)\s*:?\s*/i,
    /^(Elektronika|Telefoni|Mobilie telefoni|Dators|Auto|Mēbeles|Apģērbs|Apavi)\s*:?\s*/i,
    /^(Электроника|Телефоны|Мобильные телефоны|Компьютер|Авто|Мебель|Одежда|Обувь)\s*:?\s*/i,
  ];
  
  for (const pattern of categoryPatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    const lastSpace = cleaned.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace > maxLength * 0.6) {
      return cleaned.substring(0, lastSpace) + '...';
    }
    return cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}