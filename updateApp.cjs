const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

const replacements = [
  // Desktop Sidebar Navigation Items
  { search: /bg-emerald-800\/20 text-emerald-350 border border-emerald-500\/20/g, replace: 'bg-brand-sidebar-hover text-white border border-brand-accent/20' },
  { search: /hover:bg-emerald-900\/10/g, replace: 'hover:bg-brand-sidebar-hover' },
  { search: /border-emerald-900\/10/g, replace: 'border-brand-sidebar-hover/50' },
  { search: /border-emerald-900\/20/g, replace: 'border-brand-sidebar-hover/50' },
  { search: /bg-emerald-900\/10/g, replace: 'bg-brand-sidebar-hover' },
  { search: /border-emerald-900\/25/g, replace: 'border-slate-200' }, // Mobile header border
  
  // Text Colors
  { search: /text-emerald-500\/80/g, replace: 'text-brand-accent/80' },
  { search: /text-emerald-400/g, replace: 'text-brand-accent' },
  { search: /text-emerald-450/g, replace: 'text-brand-accent' },
  { search: /text-emerald-455/g, replace: 'text-brand-accent' },

  // Sidebar Footer
  { search: /bg-emerald-950\/50/g, replace: 'bg-brand-sidebar-hover' },
  
  // Mobile Header
  { search: /bg-\[#07130b\]\/30/g, replace: 'bg-white shadow-sm' },
  { search: /bg-\[#07130b\]\/90/g, replace: 'bg-white shadow-md border-slate-200' }, // Mobile profile menu
  
  // Mobile Drawer
  { search: /bg-\[#091a0f\]\/95/g, replace: 'bg-brand-sidebar' },
  
  // Mobile Bottom Nav
  { search: /bg-emerald-955\/35/g, replace: 'bg-white' },
  { search: /border-emerald-800\/25/g, replace: 'border-slate-200' },
  
  // Make sure mobile header text is dark
  { search: /text-white/g, replace: 'text-slate-100' }, // global text-white to slate-100 for sidebar
  { search: /text-slate-350/g, replace: 'text-slate-600' }, // Menu icon
];

for (const {search, replace} of replacements) {
  content = content.replace(search, replace);
}

// Fix mobile header specific elements that were replaced incorrectly
content = content.replace(/<h1 className="text-xs font-extrabold text-slate-100 leading-none">Vinayaga Plates<\/h1>/g, '<h1 className="text-xs font-extrabold text-slate-800 leading-none">Vinayaga Plates</h1>');
content = content.replace(/<p className="font-bold text-slate-100 leading-none">\{displayName\}<\/p>/g, '<p className="font-bold text-slate-800 leading-none">{displayName}</p>');
content = content.replace(/<span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 text-\[8px\] font-black text-slate-100/g, '<span className="absolute top-1 right-1 w-3.5 h-3.5 bg-brand-accent text-[8px] font-black text-white');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx updated successfully');
