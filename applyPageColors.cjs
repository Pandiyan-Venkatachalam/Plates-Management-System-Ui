const fs = require('fs');
const path = require('path');

const pageColors = {
  'Sales.jsx': 'sky',
  'PartnerLedger.jsx': 'sky',
  'Purchase.jsx': 'orange',
  'Batch.jsx': 'purple',
  'Product.jsx': 'purple',
  'Category.jsx': 'purple',
  'Variant.jsx': 'purple',
  'Unit.jsx': 'purple',
  'Supplier.jsx': 'teal',
  'Customer.jsx': 'teal',
  'Partner.jsx': 'teal',
  'ProfitLossReport.jsx': 'rose',
  'Expense.jsx': 'rose',
  'BusinessAccount.jsx': 'rose',
  'Dashboard.jsx': 'indigo',
  'UsersAndRoles.jsx': 'slate',
  'AuditLog.jsx': 'slate'
};

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'Login.jsx' && f !== 'Stock.jsx' && f !== 'More.jsx');

for (const file of files) {
  if (!pageColors[file]) continue;
  
  const color = pageColors[file];
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replacements
  content = content.replace(/text-brand-accent\/80/g, `text-${color}-500`);
  content = content.replace(/text-brand-accent/g, `text-${color}-600`);
  content = content.replace(/bg-brand-accent\/10/g, `bg-${color}-50`);
  content = content.replace(/bg-brand-accent\/20/g, `bg-${color}-100`);
  content = content.replace(/hover:bg-brand-accent\/20/g, `hover:bg-${color}-100`);
  content = content.replace(/hover:bg-brand-accent\/90/g, `hover:bg-${color}-500`);
  content = content.replace(/bg-brand-accent/g, `bg-${color}-600`);
  content = content.replace(/border-brand-accent\/50/g, `border-${color}-300`);
  content = content.replace(/border-brand-accent\/20/g, `border-${color}-200`);
  content = content.replace(/border-brand-accent/g, `border-${color}-500`);
  content = content.replace(/focus:border-brand-accent/g, `focus:border-${color}-500`);
  content = content.replace(/focus:ring-brand-accent\/50/g, `focus:ring-${color}-500/30`);
  content = content.replace(/fill-brand-accent\/20/g, `fill-${color}-500/20`);

  // Extra contrast fixes based on user request (font visibility)
  // Ensure tables and regular text are dark
  content = content.replace(/text-slate-600/g, 'text-slate-700'); // make secondary text a bit darker
  
  // Make headings bolder
  content = content.replace(/className="text-2xl font-bold/g, 'className="text-2xl font-extrabold');
  content = content.replace(/className="text-xl font-bold/g, 'className="text-xl font-extrabold');
  content = content.replace(/text-sm font-bold/g, 'text-sm font-extrabold');
  
  // Make table rows and data more readable
  content = content.replace(/text-xs text-slate-200/g, 'text-sm text-slate-700'); // from old table styles
  content = content.replace(/text-xs text-slate-800/g, 'text-sm text-slate-800'); // increase font size for tables
  content = content.replace(/px-6 py-4/g, 'px-4 py-3'); // reduce padding slightly to fit larger text
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Applied ${color} theme to ${file}`);
  }
}
