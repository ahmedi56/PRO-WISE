const fs = require('fs');
const buffer = fs.readFileSync('models.json');
let content = buffer.toString('utf16le');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
try {
  const data = JSON.parse(content);
  console.log('Total models:', data.data.length);
  const freeModels = data.data.filter(m => m.id.includes('free'));
  console.log('Free models:', freeModels.map(m => m.id).slice(0, 30));
} catch (e) {
  console.error('Error parsing UTF16 JSON:', e.message);
  console.log('First 50 chars:', content.slice(0, 50));
}
