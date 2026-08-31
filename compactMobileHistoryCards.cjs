const fs = require('fs');
const path = require('path');

const targetDir = 'src/pages';
const files = fs.readdirSync(targetDir);

for (let file of files) {
  if (path.extname(file) === '.jsx') {
    const filePath = path.join(targetDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Actions container padding
    if (content.includes('p-2 sm:p-2.5')) {
      content = content.replace(/p-2 sm:p-2.5/g, 'p-1.5 sm:p-2.5');
      modified = true;
    }

    // 2. Action buttons heights
    if (content.includes('h-9')) {
      content = content.replace(/\bh-9\b/g, 'h-8');
      modified = true;
    }

    // 3. Card header padding
    if (content.includes('px-3 py-2.5 sm:px-4 sm:py-3')) {
      content = content.replace(/px-3 py-2.5 sm:px-4 sm:py-3/g, 'px-2.5 py-1.5 sm:px-4 sm:py-3');
      modified = true;
    }

    // 4. Details wrapper margin/padding
    // We can replace standard detail block patterns flexibly:
    const oldDetailsPatterns = [
      /mx-3 rounded-lg bg-white border border-slate-200\/20 p-2/g,
      /mx-4 my-3.5 rounded-xl bg-white border border-slate-200\/20 p-3/g,
      /mx-4 my-3 rounded-xl bg-white border border-slate-200\/20 p-3/g,
      /mx-3 my-2.5 rounded-xl bg-white border border-slate-200\/20 p-2.5/g,
      /mx-4 my-3 rounded-2xl bg-white border border-slate-200\/20 p-3/g,
      /mx-4 my-3\.5 rounded-xl bg-white border border-slate-200\/20 p-3/g
    ];

    const newDetailsPattern = 'mx-2.5 my-1.5 rounded-xl bg-white border border-slate-200/10 p-2 text-[11px]';

    for (let pattern of oldDetailsPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, newDetailsPattern);
        modified = true;
      }
    }

    // 5. Details row spacings
    if (content.includes('space-y-1.5')) {
      content = content.replace(/space-y-1.5/g, 'space-y-1');
      modified = true;
    }

    // 6. Text sizes inside card values
    if (content.includes('text-xs text-slate-700')) {
      content = content.replace(/text-xs text-slate-700/g, 'text-[11px] text-slate-700');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Compacted mobile history card elements in: ${file}`);
    }
  }
}
