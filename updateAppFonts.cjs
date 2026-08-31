const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');
let originalContent = content;

// Increase font weights and adjust text colors for better readability
content = content.replace(/text-slate-400/g, 'text-slate-300'); // Lighter on dark bg for better contrast
content = content.replace(/text-xs font-black/g, 'text-sm font-extrabold');
content = content.replace(/text-\[10px\] font-black/g, 'text-xs font-extrabold');
content = content.replace(/text-xs font-semibold/g, 'text-sm font-bold');
content = content.replace(/text-sm font-black/g, 'text-base font-extrabold');
content = content.replace(/text-\[9px\]/g, 'text-[10px]');
content = content.replace(/text-\[7px\]/g, 'text-[8px]');

// Fix mobile header to have better contrast
content = content.replace(/text-slate-600 hover:text-slate-100/g, 'text-slate-700 hover:text-indigo-600'); 
content = content.replace(/text-slate-800 leading-none/g, 'text-slate-900 leading-none');

if (content !== originalContent) {
  fs.writeFileSync('src/App.jsx', content, 'utf8');
  console.log('App.jsx typography updated');
}
