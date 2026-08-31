const fs = require('fs');
const path = require('path');

const dir = 'src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const colorsToReplace = ['sky', 'orange', 'purple', 'teal', 'rose', 'indigo'];

// Helper function to replace all variants of a color with standard brand-accent or blue
function replaceColorVariants(content, color) {
  // Replace text colors
  content = content.replace(new RegExp(`text-${color}-500`, 'g'), 'text-brand-accent');
  content = content.replace(new RegExp(`text-${color}-600`, 'g'), 'text-brand-accent');
  
  // Replace bg colors
  content = content.replace(new RegExp(`bg-${color}-50`, 'g'), 'bg-blue-50');
  content = content.replace(new RegExp(`bg-${color}-100`, 'g'), 'bg-blue-100');
  content = content.replace(new RegExp(`hover:bg-${color}-100`, 'g'), 'hover:bg-blue-100');
  content = content.replace(new RegExp(`hover:bg-${color}-500`, 'g'), 'hover:bg-brand-accent/90');
  content = content.replace(new RegExp(`bg-${color}-600`, 'g'), 'bg-brand-accent');
  
  // Replace border colors
  content = content.replace(new RegExp(`border-${color}-200`, 'g'), 'border-blue-200');
  content = content.replace(new RegExp(`border-${color}-300`, 'g'), 'border-blue-300');
  content = content.replace(new RegExp(`border-${color}-500`, 'g'), 'border-brand-accent');
  
  // Replace focus states
  content = content.replace(new RegExp(`focus:border-${color}-500`, 'g'), 'focus:border-brand-accent');
  content = content.replace(new RegExp(`focus:ring-${color}-500\\/30`, 'g'), 'focus:ring-brand-accent/30');
  
  // Replace fills
  content = content.replace(new RegExp(`fill-${color}-500\\/20`, 'g'), 'fill-brand-accent/20');

  return content;
}

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove vibrant colors and standardize to brand-accent (Blue 600)
  for (const color of colorsToReplace) {
    content = replaceColorVariants(content, color);
  }

  // 2. Strict Black/White Data Typography
  // Previously we had text-slate-700 or text-slate-800 for tables. The user wants strictly black/dark text.
  content = content.replace(/text-sm text-slate-700/g, 'text-sm text-slate-900 font-medium'); // Table rows
  content = content.replace(/text-sm text-slate-800/g, 'text-sm text-slate-900 font-medium');
  content = content.replace(/text-xs font-bold text-slate-700/g, 'text-xs font-bold text-slate-900');
  
  // Table headers should be distinct but neutral
  content = content.replace(/bg-slate-50 text-slate-500/g, 'bg-slate-100 text-slate-700 border-b border-slate-300');
  
  // Neutralize status text (except specific Paid/Unpaid badges if we had them)
  // We'll replace text-brand-accent in non-action areas with text-slate-900 if it was used for standard data.
  // Actually, keeping text-brand-accent for action icons (edit/delete) is fine, but for data (like phone numbers) it should be black.
  // In our previous script, we blindly replaced `text-brand-accent` (which replaced text-emerald-450). This affected Phone numbers!
  // Let's force table data cells to strictly use text-slate-900.
  // A simple heuristic: if it's inside a <td> and has font-mono (phone numbers), make it text-slate-900.
  content = content.replace(/text-brand-accent font-mono/g, 'text-slate-900 font-mono');
  
  // Specific fix for Supplier/Customer phone numbers and standard fields
  content = content.replace(/font-semibold text-brand-accent font-mono/g, 'font-semibold text-slate-900 font-mono');
  content = content.replace(/font-semibold text-brand-accent/g, 'font-semibold text-slate-900');
  
  // Make sure buttons still have white text!
  content = content.replace(/bg-brand-accent text-slate-900/g, 'bg-brand-accent text-white');
  content = content.replace(/bg-brand-accent text-slate-800/g, 'bg-brand-accent text-white');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Enforced strict ERP theme on ${file}`);
  }
}
