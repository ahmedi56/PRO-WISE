import { pathToFileURL } from 'url';
const path = 'C:\\Users\\T560\\Desktop\\PRO-WISE\\mobile\\metro.config.js';
console.log('Trying import of:', path);
try {
  await import(path);
} catch (e) {
  console.log('Failed as expected with raw path');
}

const url = pathToFileURL(path).href;
console.log('Trying import of:', url);
try {
  await import(url);
  console.log('Succeeded with file:// URL');
} catch (e) {
  console.log('Failed with file:// URL:', e.message);
}
