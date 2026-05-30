const fs = require('fs');
const content = fs.readFileSync('models.json', 'utf8');
try {
  const data = JSON.parse(content);
  console.log('Total models:', data.data.length);
  const freeModels = data.data.filter(m => m.id.includes('free'));
  console.log('Free models:', freeModels.map(m => m.id).slice(0, 10));
} catch (e) {
  console.error('Error parsing JSON:', e.message);
  // Try to clean it (remove BOM if any)
  const cleaned = content.replace(/^\uFEFF/, '');
  try {
    const data = JSON.parse(cleaned);
    console.log('Total models (cleaned):', data.data.length);
    const freeModels = data.data.filter(m => m.id.includes('free'));
    console.log('Free models (cleaned):', freeModels.map(m => m.id).slice(0, 10));
  } catch (e2) {
    console.error('Error parsing cleaned JSON:', e2.message);
  }
}
