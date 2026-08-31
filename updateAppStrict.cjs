const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Ensure Sidebar uses Slate
content = content.replace(/bg-brand-sidebar-hover text-white border border-brand-accent\/20/g, 'bg-brand-accent text-white border border-brand-accent/20');
content = content.replace(/bg-brand-sidebar-hover text-slate-100 border border-brand-accent\/20/g, 'bg-brand-accent text-white border border-brand-accent/20');

// Replace any residual "text-brand-accent" in the sidebar with standard white or slate-300
content = content.replace(/text-brand-accent\/80/g, 'text-slate-400'); // the "Products & Stock" headers
content = content.replace(/text-brand-accent font-bold/g, 'text-brand-accent font-bold'); // keep active state blue for text links

// Fix mobile drawer
content = content.replace(/bg-emerald-800\/20 text-brand-accent border border-emerald-500\/20/g, 'bg-brand-accent text-white border border-brand-accent/20');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx updated for strict ERP theme');
