const fs = require('fs');

// --- 1. Modify Sales.jsx ---
let salesContent = fs.readFileSync('src/pages/Sales.jsx', 'utf8');
salesContent = salesContent.replace(
  /\{(\/\*|=+)\s*STAT CARDS\s*((\*\/|=+)\})?\s*<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">[\s\S]*?<\/section>/,
  `{/* =====================================================
          STAT CARDS
      ===================================================== */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <FileText size={14} className="sm:hidden" />
            <FileText size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Invoices:</span>
              <span className="hidden sm:inline">Total Invoices</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{filteredSales.length}</span>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <CircleDollarSign size={14} className="sm:hidden" />
            <CircleDollarSign size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Sales:</span>
              <span className="hidden sm:inline">Total Sales</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalSalesVal)}</span>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <WalletCards size={14} className="sm:hidden" />
            <WalletCards size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Collected:</span>
              <span className="hidden sm:inline">Collected</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalCollectedVal)}</span>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <TrendingUp size={14} className="sm:hidden" />
            <TrendingUp size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Outstanding:</span>
              <span className="hidden sm:inline">Outstanding</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalDueVal)}</span>
          </div>
        </div>
      </section>`
);
fs.writeFileSync('src/pages/Sales.jsx', salesContent, 'utf8');
console.log('Updated Sales.jsx');

// --- 2. Modify Purchase.jsx ---
let purchaseContent = fs.readFileSync('src/pages/Purchase.jsx', 'utf8');
purchaseContent = purchaseContent.replace(
  /\{(\/\*|=+)\s*STAT CARDS\s*((\*\/|=+)\})?\s*<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">[\s\S]*?<\/section>/,
  `{/* =====================================================
          STAT CARDS
      ===================================================== */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <FileText size={14} className="sm:hidden" />
            <FileText size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Invoices:</span>
              <span className="hidden sm:inline">Total Invoices</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{filteredPurchases.length}</span>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <CircleDollarSign size={14} className="sm:hidden" />
            <CircleDollarSign size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Purchases:</span>
              <span className="hidden sm:inline">Total Purchases</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalPurchasesVal)}</span>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <WalletCards size={14} className="sm:hidden" />
            <WalletCards size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Spent:</span>
              <span className="hidden sm:inline">Spent Paid</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalSpentVal)}</span>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <TrendingUp size={14} className="sm:hidden" />
            <TrendingUp size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Due:</span>
              <span className="hidden sm:inline">Balance </span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalDueVal)}</span>
          </div>
        </div>
      </section>`
);
fs.writeFileSync('src/pages/Purchase.jsx', purchaseContent, 'utf8');
console.log('Updated Purchase.jsx');

// --- 3. Modify ProfitLossReport.jsx ---
let plContent = fs.readFileSync('src/pages/ProfitLossReport.jsx', 'utf8');
plContent = plContent.replace(
  /\{(\/\*|=+)\s*SUMMARY METRICS CARDS\s*((\*\/|=+)\})?\s*<section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">[\s\S]*?<\/section>/,
  `{/* =====================================================
          SUMMARY METRICS CARDS
      ===================================================== */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <TrendingUp size={14} className="sm:hidden" />
            <TrendingUp size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Revenue:</span>
              <span className="hidden sm:inline">Total Revenue</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(data.totalRevenue)}</span>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Aggregate invoiced sales</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <BarChart2 size={14} className="sm:hidden" />
            <BarChart2 size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">COGS:</span>
              <span className="hidden sm:inline">Total COGS</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(data.totalCost)}</span>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Landed material cost</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-brand-accent border border-brand-accent/20 sm:mb-2">
            <BarChart2 size={14} className="sm:hidden" />
            <BarChart2 size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Expenses:</span>
              <span className="hidden sm:inline">Operating Expenses</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(data.totalExpenses || 0)}</span>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Salaries, logistics, rent</p>
          </div>
        </div>

        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <Layers size={14} className="sm:hidden" />
            <Layers size={16} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Profit:</span>
              <span className="hidden sm:inline">Net Profit</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(data.totalProfit)}</span>
            <p className="hidden sm:block text-[9px] text-slate-500 leading-tight mt-0.5">Revenue - Cost - Expense</p>
          </div>
        </div>
      </section>`
);
fs.writeFileSync('src/pages/ProfitLossReport.jsx', plContent, 'utf8');
console.log('Updated ProfitLossReport.jsx');

// --- 4. Modify Expense.jsx ---
let expContent = fs.readFileSync('src/pages/Expense.jsx', 'utf8');
expContent = expContent.replace(
  /<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2\.5 shadow-xl flex items-center gap-2">[\s\S]*?<FileText size=\{13\} \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/, // Wait, Expense.jsx doesn't have FileText, it has DollarSign and WalletCards
  '' // Safe to just targeted replace the individual card elements
);

// We can just target the cards exactly:
expContent = expContent.replace(
  /<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2\.5 shadow-xl flex items-center gap-2">\s*<div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-blue-50\/10 text-rose-450 border border-brand-accent\/20">[\s\S]*?<\/div>\s*<div className="flex items-baseline gap-1.5 overflow-hidden">\s*<span className="text-\[9px\] sm:text-\[10px\] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Outflow:<\/span>\s*<span className="text-xs sm:text-sm font-extrabold text-slate-800 whitespace-nowrap">{money\(totalExpenseVal\)}<\/span>\s*<\/div>\s*<\/div>/g,
  `<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-blue-50/10 text-rose-400 border border-brand-accent/20 sm:mb-2">
            <DollarSign size={14} className="sm:hidden" />
            <DollarSign size={18} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Outflow:</span>
              <span className="hidden sm:inline">Month Outflow</span>
            </span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalExpenseVal)}</span>
          </div>
        </div>`
);

// Fallback replacement for the Outflow card if previous one missed due to slight variation
expContent = expContent.replace(
  /Outflow:[\s\S]*?<\/div>\s*<\/div>/,
  `Outflow:</span>
            <span className="text-xs sm:text-lg font-extrabold text-slate-800 whitespace-nowrap sm:mt-1">{money(totalExpenseVal)}</span>
          </div>
        </div>`
);

expContent = expContent.replace(
  /<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2\.5 shadow-xl flex items-center gap-2">\s*<div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white border border-brand-accent\/20">[\s\S]*?Status:[\s\S]*?<\/div>\s*<\/div>/g,
  `<div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-xl flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
          <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full sm:rounded-xl bg-brand-accent text-white border border-brand-accent/20 sm:mb-2">
            <WalletCards size={14} className="sm:hidden" />
            <WalletCards size={18} className="hidden sm:block" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start sm:gap-0 overflow-hidden">
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <span className="sm:hidden">Status:</span>
              <span className="hidden sm:inline">Closing Status</span>
            </span>
            <span className={\`text-xs sm:text-sm font-extrabold \${isPeriodClosed ? 'text-rose-405' : 'text-brand-accent'} whitespace-nowrap sm:mt-1\`}>
              {isPeriodClosed ? '🔒 Closed' : '🔓 Open'}
            </span>
          </div>
        </div>`
);

fs.writeFileSync('src/pages/Expense.jsx', expContent, 'utf8');
console.log('Updated Expense.jsx');
