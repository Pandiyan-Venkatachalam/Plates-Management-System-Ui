import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronRight, Activity, Database } from 'lucide-react';

export default function AuditLog() {
  const { apiRequest } = useAuth();
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = () => {
    apiRequest('/report/get-audit-history').then(res => setAudit(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAudit = audit.filter(a => 
    a.actionName?.toLowerCase().includes(search.toLowerCase()) ||
    a.tableName?.toLowerCase().includes(search.toLowerCase()) ||
    a.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* =========================================================
          PREMIUM PRINT ONLY REPORT HEADER (Vinayaga Plates)
      ========================================================= */}
      <div className="hidden print:block mb-5 space-y-3">
        <div className="text-center pb-2.5 border-b-2 border-slate-900">
          <div className="flex items-center justify-center gap-3 mb-0.5">
            <div className="h-[1.5px] w-12 bg-blue-900" />
            <h1 className="text-3xl font-black tracking-[0.2em] text-blue-950 uppercase print-brand-title">
              VINAYAGA PLATES
            </h1>
            <div className="h-[1.5px] w-12 bg-blue-900" />
          </div>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Manufacturing & Inventory Management System
          </p>
          <div className="mt-2">
            <span className="inline-block px-4 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-widest">
              Security Trail Audit Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-2 gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[11px] font-black text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Audit Log Entries</span>
            <span className="text-[11px] font-black text-slate-900">{filteredAudit.length} Logs</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-col gap-1.5 sm:gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span>Settings</span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-brand-accent">Security Logs</span>
        </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            Security Trail Audit
          </h1>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}
      <section className="bg-[#fff7f9] rounded-2xl p-2 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden">
        <div className="relative w-full lg:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, table, or user..."
            className="h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>
      </section>

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}
      <section className="hidden lg:block bg-[#fff7f9] rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Action</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Target Table (ID)</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-right">Initiated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAudit.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No logs found matching "{search}".
                  </td>
                </tr>
              ) : (
                filteredAudit.map((a) => (
                  <tr key={a.auditId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold bg-amber-50 text-amber-600">
                        <Activity size={10} strokeWidth={3} />
                        {a.actionName}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700 text-xs">
                      {a.tableName} <span className="text-slate-400 font-mono text-[10px]">(ID: {a.recordId})</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800 text-xs">@{a.username}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          MOBILE LIST
      ===================================================== */}
      <section className="space-y-3.5 lg:hidden">
        {filteredAudit.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No logs found matching "{search}".
          </div>
        ) : (
          filteredAudit.map((a) => (
            <article key={a.auditId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                      <Activity size={10} strokeWidth={3} />
                      {a.actionName}
                    </span>
                  </div>
                  <span className="relative z-10 text-[10px] font-bold text-slate-300 font-mono tracking-wider">
                    {new Date(a.timestamp).toLocaleString()}
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 bg-white text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Target Table:</span> 
                    <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{a.tableName} <span className="text-slate-400 font-mono text-[10px]">(ID: {a.recordId})</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Initiated By:</span> 
                    <span className="font-mono font-bold text-slate-800">@{a.username}</span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
