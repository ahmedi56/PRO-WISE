const fs = require('fs');
const buffer = fs.readFileSync('models.json');
const content = buffer.toString('utf16le');
try {
  const data = JSON.parse(content);
  console.log('Total models:', data.data.length);
  const freeModels = data.data.filter(m => m.id.includes('free'));
  console.log('Free models:', freeModels.map(m => m.id).slice(0, 20));
} catch (e) {
  console.error('Error parsing UTF16 JSON:', e.message);
}
