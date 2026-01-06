const categoriesMain = require('./categories_main.json');
const ssCategories = require('./ss-lv-categories.json');
const andeleCategories = require('./andele-categories.json');

console.log('📦 categories_main.json (Unified Mapping)');
console.log(`   Total: ${categoriesMain.length} categories`);
console.log('   Sample:');
console.log(JSON.stringify(categoriesMain.slice(0, 2), null, 2));

console.log('\n📦 ss-lv-categories.json');
console.log(`   Total: ${ssCategories.length} categories`);
console.log('   Sample:');
console.log(JSON.stringify(ssCategories.slice(0, 2), null, 2));

console.log('\n📦 andele-categories.json');
console.log(`   Total: ${andeleCategories.length} categories`);
console.log('   Sample:');
console.log(JSON.stringify(andeleCategories.slice(0, 2), null, 2));

console.log('\n✨ Usage examples:');
console.log(`
// Import in your Next.js app:
import categories from './CATEGORIES/categories_main.json';

// Find by ID:
const category = categories.find(c => c.id === 'CM00002');

// Filter by type:
const normal = categories.filter(c => c.type === 'normal');

// Get Andele ID from SS ID:
const getAndeleId = (ssId) => {
  return categories.find(c => c.ssId === ssId)?.andeleId;
};
`);
