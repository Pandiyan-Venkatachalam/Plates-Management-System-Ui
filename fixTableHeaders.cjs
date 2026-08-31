const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Increase the size of the table headers to better match the table content (text-sm)
  // We'll replace text-[10px] inside the thead class with text-xs or text-sm.
  content = content.replace(/uppercase text-\[10px\] font-semibold/g, 'uppercase text-xs font-bold');
  content = content.replace(/uppercase text-\[10px\] font-bold/g, 'uppercase text-xs font-bold');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed table headers in ${file}`);
  }
}
