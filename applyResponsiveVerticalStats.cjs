const fs = require('fs');

function clean(str) {
  return str.replace(/\s+/g, '');
}

function replaceFlexible(filePath, oldBlock, newBlock) {
  let content = fs.readFileSync(filePath, 'utf8');
  let cleanContent = clean(content);
  let cleanOld = clean(oldBlock);

  let index = cleanContent.indexOf(cleanOld);
  if (index === -1) {
    return false;
  }

  // We found a match. Now we need to find the exact start and end in the original content.
  // We can do this by scanning character by character.
  let contentIdx = 0;
  let cleanIdx = 0;

  let matchStart = -1;
  let matchEnd = -1;

  while (contentIdx < content.length && cleanIdx < cleanContent.length) {
    if (cleanIdx === index) {
      matchStart = contentIdx;
    }

    const contentChar = content[contentIdx];
    if (/\s/.test(contentChar)) {
      contentIdx++;
      continue;
    }

    if (cleanIdx === index + cleanOld.length) {
      matchEnd = contentIdx;
      break;
    }

    cleanIdx++;
    contentIdx++;
  }

  if (matchStart !== -1 && matchEnd !== -1) {
    const before = content.substring(0, matchStart);
    const after = content.substring(matchEnd);
    fs.writeFileSync(filePath, before + newBlock + after, 'utf8');
    console.log(`Successfully updated: ${filePath}`);
    return true;
  }

  return false;
}

// --- 1. Sales.jsx ---
const oldSalesBlock = `<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <FileText size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Invoices</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{filteredSales.length}</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <CircleDollarSign size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Sales</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(totalSalesVal)}</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <WalletCards size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Collected</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(totalCollectedVal)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5"></p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-500/10 text-rose-400 border border-brand-accent/20">
            <TrendingUp size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Outstanding</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(totalDueVal)}</p>
        </div>
      </section>`;

const newSalesBlock = `<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <FileText size={14} className="sm:hidden" />
            <FileText size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Total Invoices</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{filteredSales.length}</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <CircleDollarSign size={14} className="sm:hidden" />
            <CircleDollarSign size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Total Sales</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalSalesVal)}</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <WalletCards size={14} className="sm:hidden" />
            <WalletCards size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Collected</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalCollectedVal)}</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <TrendingUp size={14} className="sm:hidden" />
            <TrendingUp size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Outstanding</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalDueVal)}</p>
          </div>
        </div>
      </section>`;

if (!replaceFlexible('src/pages/Sales.jsx', oldSalesBlock, newSalesBlock)) {
  console.log('Sales.jsx match failed');
}

// --- 2. Purchase.jsx ---
const oldPurchaseBlock = `<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <FileText size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Invoices</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{filteredPurchases.length}</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <CircleDollarSign size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Purchases</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(totalPurchasesVal)}</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <WalletCards size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Spent Paid</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(totalPaidVal)}</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-500/10 text-rose-400 border border-brand-accent/20">
            <TrendingUp size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Balance </p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(totalDueVal)}</p>
        </div>
      </section>`;

const newPurchaseBlock = `      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <FileText size={14} className="sm:hidden" />
            <FileText size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Total Invoices</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{filteredPurchases.length}</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <CircleDollarSign size={14} className="sm:hidden" />
            <CircleDollarSign size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Total Purchases</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalPurchasesVal)}</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <WalletCards size={14} className="sm:hidden" />
            <WalletCards size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Spent Paid</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalPaidVal)}</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <TrendingUp size={14} className="sm:hidden" />
            <TrendingUp size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Balance </p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalDueVal)}</p>
          </div>
        </div>
      </section>`;

if (!replaceFlexible('src/pages/Purchase.jsx', oldPurchaseBlock, newPurchaseBlock)) {
  console.log('Purchase.jsx match failed');
}

// --- 3. ProfitLossReport.jsx ---
const oldPlBlock = `<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <TrendingUp size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Revenue</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(data.totalRevenue)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Aggregate invoiced sales</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-500/10 text-brand-accent border border-brand-accent/20">
            <BarChart2 size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Cost</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(data.totalCost)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Landed material cost of goods</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-455 border border-amber-500/20">
            <BarChart2 size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Operating Expenses</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(data.totalExpenses || 0)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Salaries, logisitics, rent costs</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <Layers size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Net Profit</p>
          <p className={\`mt-1 text-lg font-extrabold \${data.totalProfit >= 0 ? 'text-brand-accent' : 'text-rose-450'}\`}>
            {money(data.totalProfit)}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">Revenue - Cost - Expense</p>
        </div>
      </section>`;

// Wait! In ProfitLossReport.jsx view output, it says:
// bg-amber-500/10 text-amber-450 border border-amber-500/20
// and net profit text is data.totalProfit >= 0 ? 'text-brand-accent' : 'text-rose-400'
// Let's make sure the string in script matches that:
const oldPlBlockActual = `<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <TrendingUp size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Revenue</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(data.totalRevenue)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Aggregate invoiced sales</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-500/10 text-brand-accent border border-brand-accent/20">
            <BarChart2 size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Cost</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(data.totalCost)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Landed material cost of goods</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-450 border border-amber-500/20">
            <BarChart2 size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Operating Expenses</p>
          <p className="mt-1 text-lg font-extrabold text-slate-800">{money(data.totalExpenses || 0)}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">Salaries, logisitics, rent costs</p>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <Layers size={16} />
          </div>
          <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Net Profit</p>
          <p className={\`mt-1 text-lg font-extrabold \${data.totalProfit >= 0 ? 'text-brand-accent' : 'text-rose-400'}\`}>
            {money(data.totalProfit)}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">Revenue - Cost - Expense</p>
        </div>
      </section>`;

const newPlBlock = `      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <TrendingUp size={14} className="sm:hidden" />
            <TrendingUp size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Total Revenue</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(data.totalRevenue)}</p>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Aggregate invoiced sales</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <BarChart2 size={14} className="sm:hidden" />
            <BarChart2 size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Total Cost</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(data.totalCost)}</p>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Landed material cost</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-amber-500/10 text-amber-450 border border-amber-500/20 sm:mb-2">
            <BarChart2 size={14} className="sm:hidden" />
            <BarChart2 size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Operating Expenses</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(data.totalExpenses || 0)}</p>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Salaries, logisitics, rent costs</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <Layers size={14} className="sm:hidden" />
            <Layers size={16} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Net Profit</p>
            <p className={\`text-xs sm:text-lg font-extrabold \${data.totalProfit >= 0 ? 'text-brand-accent' : 'text-rose-400'} leading-tight mt-0.5\`}>{money(data.totalProfit)}</p>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Revenue - Cost - Expense</p>
          </div>
        </div>
      </section>`;

if (!replaceFlexible('src/pages/ProfitLossReport.jsx', oldPlBlockActual, newPlBlock)) {
  console.log('ProfitLossReport.jsx match failed');
}

// --- 4. Expense.jsx ---
const oldExpStatus = `<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center gap-4">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <WalletCards size={18} />
          </div>
          <div>
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Closing Status</p>
            <p className={\`text-sm font-extrabold \${isPeriodClosed ? 'text-rose-450' : 'text-brand-accent'}\`}>
              {isPeriodClosed ? '🔒 Period Closed' : '🔓 Period Open'}
            </p>
          </div>
        </div>`;

// Wait! In Expense.jsx the status text is actually data.totalProfit ... wait, no:
// text-rose-400 : 'text-brand-accent'
// Let's verify line 263 of Expense.jsx:
// isPeriodClosed ? 'text-rose-400' : 'text-brand-accent'
const oldExpStatusActual = `<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center gap-4">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent/20">
            <WalletCards size={18} />
          </div>
          <div>
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Closing Status</p>
            <p className={\`text-sm font-extrabold \${isPeriodClosed ? 'text-rose-400' : 'text-brand-accent'}\`}>
              {isPeriodClosed ? '🔒 Period Closed' : '🔓 Period Open'}
            </p>
          </div>
        </div>`;

const newExpStatus = `        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <WalletCards size={14} className="sm:hidden" />
            <WalletCards size={18} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Closing Status</p>
            <p className={\`text-xs sm:text-lg font-extrabold \${isPeriodClosed ? 'text-rose-400' : 'text-brand-accent'} leading-tight mt-0.5\`}>
              {isPeriodClosed ? '🔒 Closed' : '🔓 Open'}
            </p>
          </div>
        </div>`;

const oldExpOutflow = `<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 shadow-xl flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-blue-50/10 text-rose-400 border border-brand-accent/20">
            <DollarSign size={13} />
          </div>
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Outflow:</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalExpenseVal)}</span>
          </div>
        </div>`;

const newExpOutflow = `        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-rose-400 border border-brand-accent/20 sm:mb-2">
            <DollarSign size={14} className="sm:hidden" />
            <DollarSign size={18} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap leading-tight">Month Outflow</p>
            <p className="text-xs sm:text-lg font-extrabold text-slate-800 leading-tight mt-0.5">{money(totalExpenseVal)}</p>
          </div>
        </div>`;

if (!replaceFlexible('src/pages/Expense.jsx', oldExpStatusActual, newExpStatus)) {
  console.log('Expense.jsx status match failed');
}
if (!replaceFlexible('src/pages/Expense.jsx', oldExpOutflow, newExpOutflow)) {
  console.log('Expense.jsx outflow match failed');
}
