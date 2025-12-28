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
 * Extract first sentence from full description.
 * Wrapper function for adapter usage with validation.
 * 
 * @param {string} fullDescription - The full description text
 * @returns {string|null} - First sentence or null if too short/empty
 */
export function getDescriptionPreview(fullDescription) {
  if (!fullDescription) return null;
  
  const preview = extractFirstSentence(fullDescription, 150);
  
  // Return null if too short (probably not a real sentence)
  if (preview.length < 20) return null;
  
  return preview;
}
