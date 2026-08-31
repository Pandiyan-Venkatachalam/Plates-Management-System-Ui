const fs = require('fs');

let content = fs.readFileSync('src/pages/Supplier.jsx', 'utf8');

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
  
  // Search Bar
  { search: /bg-emerald-950\/20/g, replace: 'bg-white' },
  { search: /border-emerald-900\/40/g, replace: 'border-slate-300' },
  { search: /focus:border-emerald-500/g, replace: 'focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50' },
  
  // Table
  { search: /border-emerald-900\/10/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950\/50/g, replace: 'bg-slate-50' },
  { search: /border-emerald-900/g, replace: 'border-slate-200' }, // table border-b
  { search: /divide-emerald-900\/25/g, replace: 'divide-slate-200' },
  { search: /hover:bg-emerald-955\/35/g, replace: 'hover:bg-slate-50/50' },
  
  // Buttons (Primary) - keep button text white!
  { search: /bg-emerald-600/g, replace: 'bg-brand-accent text-white' }, // Make sure text is white on green buttons
  { search: /hover:bg-emerald-500/g, replace: 'hover:bg-brand-accent/90 text-white' },
  
  // Action Buttons (Edit/Delete)
  { search: /border-emerald-900\/35/g, replace: 'border-slate-200' },
  { search: /hover:bg-emerald-900\/20/g, replace: 'hover:bg-slate-100' },
  { search: /border-rose-900\/30/g, replace: 'border-slate-200' },
  { search: /hover:bg-rose-900\/20/g, replace: 'hover:bg-rose-50' },
  
  // Mobile Cards
  { search: /bg-emerald-955\/20/g, replace: 'bg-slate-50' },
  { search: /border-emerald-900\/20/g, replace: 'border-slate-200' },
  { search: /bg-emerald-950\/10/g, replace: 'bg-slate-50' },
  { search: /bg-emerald-955\/40/g, replace: 'bg-white' },
  { search: /border-rose-900\/35/g, replace: 'border-slate-200' },
  
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
];

for (const {search, replace} of replacements) {
  content = content.replace(search, replace);
}

// Fix primary buttons text color (it was replaced by text-white -> text-slate-800 globally)
// The "New Supplier" button, "Register"/"Save" button, "Cancel" button.
// Button classes check
content = content.replace(/text-slate-800 shadow-md transition hover:bg-brand-accent\/90/g, 'text-white shadow-md transition hover:bg-brand-accent/90');
// Cancel button
content = content.replace(/text-slate-800 rounded-xl py-2 text-xs font-semibold transition border border-slate-200 hover:bg-slate-200/g, 'text-slate-700 rounded-xl py-2 text-xs font-semibold transition border border-slate-200 hover:bg-slate-200');

fs.writeFileSync('src/pages/Supplier.jsx', content, 'utf8');
console.log('Supplier.jsx updated successfully');
