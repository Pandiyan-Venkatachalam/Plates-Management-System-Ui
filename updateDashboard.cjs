const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

const replacements = [
  // Global text adjustments
  { search: /text-white/g, replace: 'text-slate-800' },
  { search: /text-slate-350/g, replace: 'text-slate-600' },
  { search: /text-slate-400/g, replace: 'text-slate-500' },
  { search: /text-emerald-450/g, replace: 'text-brand-accent' },
  { search: /text-emerald-400/g, replace: 'text-emerald-600' }, // better contrast on white
  { search: /fill-emerald-400\/25/g, replace: 'fill-brand-accent/20' },
  
  // Card Backgrounds and Borders
  { search: /glass-panel/g, replace: 'bg-brand-card shadow-sm border border-slate-200' },
  { search: /border-emerald-900\/10/g, replace: 'border-slate-200' },
  { search: /hover:border-emerald-500\/30/g, replace: 'hover:border-brand-accent/50 hover:shadow-md' },
  
  // Chart Grids & Styles
  { search: /stroke="rgba\(255,255,255,0\.04\)"/g, replace: 'stroke="rgba(0,0,0,0.05)"' },
  { search: /bg-slate-950/g, replace: 'bg-white shadow-md' },
  { search: /border-emerald-500\/20/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950\/40/g, replace: 'bg-emerald-50' },
  { search: /border-emerald-900\/40/g, replace: 'border-emerald-100' },
  
  // Buttons
  { search: /bg-emerald-800\/25/g, replace: 'bg-brand-accent/10' },
  { search: /hover:bg-emerald-800\/35/g, replace: 'hover:bg-brand-accent/20' },
];

for (const {search, replace} of replacements) {
  content = content.replace(search, replace);
}

// Make sure icons on cards don't use light text since they have color context
content = content.replace(/text-emerald-400/g, 'text-emerald-600');

fs.writeFileSync('src/pages/Dashboard.jsx', content, 'utf8');
console.log('Dashboard.jsx updated successfully');
