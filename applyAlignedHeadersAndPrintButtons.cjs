const fs = require('fs');
const path = require('path');

const targetDir = 'src/pages';
const files = fs.readdirSync(targetDir);

const printerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>`;

for (let file of files) {
  if (path.extname(file) === '.jsx') {
    const filePath = path.join(targetDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Normalize content line endings for match consistency
    let norm = content.replace(/\r\n/g, '\n');
    
    const startTag = '<section className="flex justify-between items-center gap-2 sm:items-end">';
    const startIdx = norm.indexOf(startTag);
    if (startIdx === -1) continue;
    
    const endIdx = norm.indexOf('</section>', startIdx);
    if (endIdx === -1) continue;
    
    const sectionContent = norm.substring(startIdx + startTag.length, endIdx);
    
    // Find the breadcrumb div (support text-slate-700 or text-slate-900)
    const bcMatch = sectionContent.match(/<div className="(?:mb-1\s+)?flex items-center gap-1\.5 text-xs font-semibold text-slate-\d+">[\s\S]*?<\/div>/);
    if (!bcMatch) continue;
    const breadcrumbsHtml = bcMatch[0].replace('className="mb-1 flex', 'className="flex');
    
    // Find h1
    const h1Match = sectionContent.match(/<h1 className="text-3xl font-serif font-extrabold tracking-tight text-slate-800">[\s\S]*?<\/h1>/);
    if (!h1Match) continue;
    const h1Html = h1Match[0].replace('className="text-3xl', 'className="text-2xl sm:text-3xl leading-none');
    
    // The rest of the content after the inner div is buttons
    // The inner div opens after start and closes after h1
    const innerDivEnd = sectionContent.indexOf('</div>', sectionContent.indexOf(h1Html)) + 6;
    const buttonsHtml = sectionContent.substring(innerDivEnd).trim();
    
    let newButtonsHtml = '';
    
    if (file === 'Batch.jsx') {
      const oldPrintBtn = `bg-slate-100/40 hover:bg-slate-200/25 border border-slate-200/35 text-brand-accent rounded-xl px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-sm`;
      const newPrintBtn = `bg-slate-100/40 hover:bg-slate-200/25 border border-slate-200/35 text-brand-accent rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm`;
      newButtonsHtml = buttonsHtml.replace(oldPrintBtn, newPrintBtn);
    } else if (file === 'Expense.jsx') {
      const oldFlexStart = '<div className="flex gap-2">';
      const newFlexStart = `<div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="bg-slate-100/40 hover:bg-slate-200/25 border border-slate-200/35 text-brand-accent rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            ${printerIconSvg}
            <span>Print</span>
          </button>`;
      newButtonsHtml = buttonsHtml.replace(oldFlexStart, newFlexStart);
    } else if (file === 'ProfitLossReport.jsx') {
      newButtonsHtml = `
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="bg-slate-100/40 hover:bg-slate-200/25 border border-slate-200/35 text-brand-accent rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            ${printerIconSvg}
            <span>Print</span>
          </button>
        </div>`;
    } else {
      newButtonsHtml = `
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="bg-slate-100/40 hover:bg-slate-200/25 border border-slate-200/35 text-brand-accent rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            ${printerIconSvg}
            <span>Print</span>
          </button>
          ${buttonsHtml}
        </div>`;
    }
    
    const newSection = `
      <section className="flex flex-col gap-1.5">
        ${breadcrumbsHtml}
        <div className="flex justify-between items-center gap-2.5">
          ${h1Html.replace('className="text-3xl', 'className="text-2xl sm:text-3xl leading-none')}
          ${newButtonsHtml}
        </div>
      </section>`;
      
    let finalContent = norm.substring(0, startIdx) + newSection + norm.substring(endIdx + 10);
    
    // Specific cleanup for Sales.jsx
    if (file === 'Sales.jsx') {
      const exportBtnDesktop = `<button className="text-xs font-semibold text-slate-900 hover:text-slate-700 underline">
            Export Report
          </button>`;
      const exportBtnMobile = `<button className="text-xs font-semibold text-slate-900">Export</button>`;
      finalContent = finalContent.replace(exportBtnDesktop, '').replace(exportBtnMobile, '');
    }
    
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`Aligned header and added Print to: ${file}`);
  }
}
