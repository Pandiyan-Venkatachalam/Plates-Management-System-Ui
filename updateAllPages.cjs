const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const skipFiles = ['Dashboard.jsx', 'Supplier.jsx', 'Login.jsx'];

const replacements = [
  // Global text adjustments
  { search: /text-white/g, replace: 'text-slate-800' },
  { search: /text-slate-400/g, replace: 'text-slate-500' },
  { search: /text-slate-300/g, replace: 'text-slate-600' },
  { search: /text-emerald-500/g, replace: 'text-brand-accent' },
  { search: /text-emerald-455/g, replace: 'text-slate-500' }, // Table header text
  { search: /text-emerald-450/g, replace: 'text-brand-accent' },
  { search: /text-emerald-400/g, replace: 'text-brand-accent' },
  { search: /text-emerald-350/g, replace: 'text-slate-600' },

  // Card Backgrounds and Borders
  { search: /glass-panel/g, replace: 'bg-brand-card shadow-sm border border-slate-200' },
  { search: /glass-panel-hover/g, replace: 'hover:shadow-md hover:border-brand-accent/50' },
  
  // Search Bar / General inputs
  { search: /bg-emerald-950\/20/g, replace: 'bg-white' },
  { search: /border-emerald-900\/40/g, replace: 'border-slate-300' },
  { search: /focus:border-emerald-500/g, replace: 'focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50' },
  
  // Table
  { search: /border-emerald-900\/10/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950\/50/g, replace: 'bg-slate-50' },
  { search: /border-emerald-900/g, replace: 'border-slate-200' }, // table border-b
  { search: /divide-emerald-900\/25/g, replace: 'divide-slate-200' },
  { search: /hover:bg-emerald-955\/35/g, replace: 'hover:bg-slate-50/50' },
  
  // Buttons (Primary) - make sure to keep text white
  { search: /bg-emerald-600/g, replace: 'bg-brand-accent text-white' }, 
  { search: /hover:bg-emerald-500/g, replace: 'hover:bg-brand-accent/90 text-white' },
  { search: /bg-emerald-500/g, replace: 'bg-brand-accent text-white' },
  
  // Action Buttons (Edit/Delete/View)
  { search: /border-emerald-900\/35/g, replace: 'border-slate-200' },
  { search: /hover:bg-emerald-900\/20/g, replace: 'hover:bg-slate-100' },
  { search: /border-rose-900\/30/g, replace: 'border-slate-200' },
  { search: /hover:bg-rose-900\/20/g, replace: 'hover:bg-rose-50' },
  
  // Mobile Cards / Badges
  { search: /bg-emerald-955\/20/g, replace: 'bg-slate-50' },
  { search: /border-emerald-900\/20/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950\/10/g, replace: 'bg-slate-50' },
  { search: /bg-emerald-955\/40/g, replace: 'bg-white' },
  { search: /border-rose-900\/35/g, replace: 'border-slate-200' },
  { search: /bg-emerald-900\/20/g, replace: 'bg-slate-100' },
  { search: /text-rose-455/g, replace: 'text-rose-500' },
  
  // Drawer Form
  { search: /bg-slate-955\/70/g, replace: 'bg-slate-900/50' },
  { search: /bg-\[#0c1810\]/g, replace: 'bg-brand-card' },
  { search: /border-emerald-900\/50/g, replace: 'border-slate-200' },
  { search: /bg-emerald-955/g, replace: 'bg-white' },
  { search: /border-emerald-900\/80/g, replace: 'border-slate-300' },
  { search: /border-emerald-900\/25/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950/g, replace: 'bg-slate-100' },
  { search: /border-emerald-850/g, replace: 'border-slate-200' },
  { search: /hover:bg-emerald-900/g, replace: 'hover:bg-slate-200' },
  { search: /border-emerald-800\/25/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950\/40/g, replace: 'bg-slate-50' },
];

for (const file of files) {
  if (skipFiles.includes(file)) continue;

  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const {search, replace} of replacements) {
    content = content.replace(search, replace);
  }

  // Primary buttons text color fix
  content = content.replace(/text-slate-800 shadow-md transition hover:bg-brand-accent\/90/g, 'text-white shadow-md transition hover:bg-brand-accent/90');
  content = content.replace(/text-slate-700 rounded-xl py-2 text-xs font-semibold transition border border-slate-200 hover:bg-slate-200/g, 'text-slate-700 rounded-xl py-2 text-xs font-semibold transition border border-slate-200 hover:bg-slate-200');
  content = content.replace(/bg-brand-accent text-slate-800/g, 'bg-brand-accent text-white');
  content = content.replace(/hover:bg-brand-accent\/90 text-slate-800/g, 'hover:bg-brand-accent/90 text-white');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
