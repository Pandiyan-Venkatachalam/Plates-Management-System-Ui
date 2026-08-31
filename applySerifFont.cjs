const fs = require('fs');
const path = require('path');

// 1. Update App.jsx to make the brand name Serif
let appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  // Look for "Vinayaga Plates"
  content = content.replace(/className="text-md font-extrabold tracking-tight text-slate-800"/g, 'className="text-lg font-serif font-extrabold tracking-tight text-slate-800"');
  content = content.replace(/className="text-lg font-extrabold tracking-tight text-slate-800"/g, 'className="text-xl font-serif font-extrabold tracking-tight text-slate-800"');
  fs.writeFileSync(appPath, content, 'utf8');
}

// 2. Update pages
const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // H1 headings
  content = content.replace(/<h1 className="text-2xl font-extrabold tracking-tight text-slate-800">/g, '<h1 className="text-3xl font-serif font-extrabold tracking-tight text-slate-800">');
  
  // H3 section headers (e.g. "Invoice History", "Staff Roster")
  content = content.replace(/<h3 className="font-bold text-slate-800 text-sm">/g, '<h3 className="font-serif font-bold text-slate-800 text-lg">');
  content = content.replace(/<h3 className="text-xs font-bold text-slate-800">/g, '<h3 className="font-serif text-sm font-bold text-slate-800">');
  
  // Settings/More section headers
  content = content.replace(/<h3 className="text-lg font-semibold text-slate-800 mb-4">/g, '<h3 className="font-serif text-xl font-bold text-slate-800 mb-4">');
  content = content.replace(/<h2 className="text-2xl font-bold text-slate-800">/g, '<h2 className="font-serif text-3xl font-extrabold text-slate-800">');

  // Specific item card titles (e.g. idx + 1. Customer Name)
  // Usually looks like <p className="text-xs font-bold text-slate-800 mt-0.5">{idx + 1}. 
  content = content.replace(/<p className="text-xs font-bold text-slate-800 mt-0\.5">\{idx \+ 1\}/g, '<p className="font-serif text-sm font-bold text-slate-800 mt-0.5">{idx + 1}');
  // <p className="text-xs font-bold text-slate-800">{idx + 1}
  content = content.replace(/<p className="text-xs font-bold text-slate-800">\{idx \+ 1\}/g, '<p className="font-serif text-sm font-bold text-slate-800">{idx + 1}');

  // In Products catalog specifically, for items inside the grid (like "8 Inch Plate")
  // They are typically <h4 className="text-md font-bold text-slate-800">
  content = content.replace(/<h4 className="text-md font-bold text-slate-800">/g, '<h4 className="font-serif text-lg font-bold text-slate-800">');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Applied serif fonts to ${file}`);
  }
}
