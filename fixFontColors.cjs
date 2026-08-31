const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix conflicting text colors on buttons (from previous bad replaces)
  content = content.replace(/text-white\/10 text-brand-accent/g, 'text-white');
  content = content.replace(/text-white text-\[10px\] font-bold text-slate-800/g, 'text-white text-[10px] font-bold');
  content = content.replace(/text-white hover:bg-blue-500 text-white text-slate-800/g, 'text-white hover:bg-blue-500');
  content = content.replace(/text-white hover:bg-blue-500 text-white/g, 'text-white hover:bg-blue-500');
  content = content.replace(/text-white px-4 py-2 text-xs font-bold text-white/g, 'text-white px-4 py-2 text-xs font-bold');

  // Fix table data and card data text colors
  // We want to change text-brand-accent to text-slate-900 in places that are clearly displaying data.
  // We'll target specific known patterns from the tables:
  content = content.replace(/font-mono text-\[11px\] text-brand-accent/g, 'font-mono text-[11px] text-slate-900');
  content = content.replace(/text-right text-brand-accent font-semibold/g, 'text-right text-slate-900 font-semibold');
  content = content.replace(/text-xs font-bold text-brand-accent/g, 'text-xs font-bold text-slate-900');
  content = content.replace(/text-brand-accent text-md/g, 'text-slate-900 text-md');
  
  // Also clean up any status badges that got mangled border colors
  content = content.replace(/border-emerald-500\/20/g, 'border-brand-accent/20');
  content = content.replace(/bg-blue-500\/10 text-rose-400 border-brand-accent\/20/g, 'bg-rose-50 text-rose-600 border-rose-200');
  content = content.replace(/bg-amber-500\/10 text-amber-400 border-amber-500\/20/g, 'bg-amber-50 text-amber-600 border-amber-200');
  
  // In cards, 'Collected' amounts might have 'text-brand-accent'
  content = content.replace(/text-lg font-extrabold text-brand-accent/g, 'text-lg font-extrabold text-slate-900');

  // Supplier table specifics
  content = content.replace(/text-\[11px\] text-brand-accent/g, 'text-[11px] text-slate-900');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed font colors in ${file}`);
  }
}
