import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function More() {
  const { apiRequest, logout } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('partners');
  const [partners, setPartners] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [audit, setAudit] = useState([]);

  const [partnerForm, setPartnerForm] = useState({ name: '', phone: '' });
  const [txForm, setTxForm] = useState({ partnerId: '', type: 'INVESTMENT', amount: 0, desc: '', accountName: 'Cash' });
  const [expenseForm, setExpenseForm] = useState({ amount: 0, desc: '', accountName: 'Cash' });

  const loadData = () => {
    apiRequest('/partner').then(res => setPartners(res.data)).catch(console.error);
    apiRequest('/partnerledger').then(res => setLedgers(res.data)).catch(console.error);
    apiRequest('/account').then(res => setAccounts(res.data)).catch(console.error);
    apiRequest('/report/get-audit-history').then(res => setAudit(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/partner', {
        method: 'POST',
        body: JSON.stringify({ partnerName: partnerForm.name, contactPhone: partnerForm.phone })
      });
      alert('Partner added!');
      setPartnerForm({ name: '', phone: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePartnerTx = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/partnerledger/create-transaction', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: parseInt(txForm.partnerId),
          transactionType: txForm.type,
          amount: parseFloat(txForm.amount),
          description: txForm.desc,
          accountName: txForm.accountName
        })
      });
      alert('Partner transaction recorded!');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/expense/create-expense', {
        method: 'POST',
        body: JSON.stringify({
          description: expenseForm.desc,
          amount: parseFloat(expenseForm.amount),
          accountId: parseInt(expenseForm.accountId || accounts[0]?.accountId || 1)
        })
      });
      alert('Expense recorded.');
      setExpenseForm({ amount: 0, desc: '', accountName: 'Cash' });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span>Settings</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m9 18 6-6-6-6"/></svg>
          <span className="text-brand-accent">More Modules</span>
        </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            More Management Modules
          </h1>
        </div>
      </section>

      {/* =====================================================
          TABS
      ===================================================== */}
      <div className="flex gap-2 border-b border-slate-100 pb-2">
        <button 
          onClick={() => setActiveSubTab('partners')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'partners' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        >
          Partners Equity
        </button>
        <button 
          onClick={() => setActiveSubTab('expenses')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'expenses' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        >
          Expenses
        </button>
        <button 
          onClick={() => setActiveSubTab('audit')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'audit' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
        >
          Audit Trail
        </button>
      </div>

      {activeSubTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#fff7f9] rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-widest">Partners Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {partners.map(p => (
                  <div key={p.partnerId} className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                    <h4 className="text-sm font-bold text-slate-800">{p.partnerName}</h4>
                    <p className="text-slate-500 text-[10px] mt-1 font-mono">{p.contactPhone}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#fff7f9] rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Partners Equity History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
                    <tr className="border-b border-slate-800">
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Partner</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Type</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-right">Amount</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgers.map(l => (
                      <tr key={l.ledgerId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-3 font-bold text-slate-800 text-xs">{l.partner?.partnerName}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold ${l.transactionType === 'INVESTMENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {l.transactionType}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-slate-800 text-xs text-right">₹{l.amount?.toLocaleString()}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{l.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleCreatePartner} className="bg-[#fff7f9] rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add Partner</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Name</label>
                <input type="text" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone</label>
                <input type="text" value={partnerForm.phone} onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-sm">
                Create Partner
              </button>
            </form>

            <form onSubmit={handlePartnerTx} className="bg-[#fff7f9] rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Partner Ledger Action</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Select Partner</label>
                <select value={txForm.partnerId} onChange={(e) => setTxForm({ ...txForm, partnerId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required>
                  <option value="">Select Partner</option>
                  {partners.map(p => <option key={p.partnerId} value={p.partnerId}>{p.partnerName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Action Type</label>
                <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required>
                  <option value="INVESTMENT">INVESTMENT</option>
                  <option value="WITHDRAWAL">WITHDRAWAL</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount</label>
                <input type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Physical Account mapping</label>
                <select value={txForm.accountName} onChange={(e) => setTxForm({ ...txForm, accountName: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required>
                  {accounts.map(a => <option key={a.accountId} value={a.accountName}>{a.accountName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                <input type="text" value={txForm.desc} onChange={(e) => setTxForm({ ...txForm, desc: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required />
              </div>
              <button type="submit" className="w-full bg-brand-accent hover:bg-blue-600 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-sm shadow-brand-accent/20">
                Submit Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#fff7f9] rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-widest border-b border-slate-100 pb-2">Cash Outflow Ledger</h3>
            <div className="space-y-2">
              {ledgers.filter(l => l.transactionType === 'EXPENSE').length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No expenses recorded.</div>
              ) : ledgers.filter(l => l.transactionType === 'EXPENSE').map((e, idx) => (
                <div key={idx} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-slate-800 font-bold text-xs">{e.description}</p>
                    <span className="text-slate-500 text-[10px] font-mono tracking-wider block mt-1">{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-rose-600 font-mono font-bold text-xs">-₹{e.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleExpense} className="bg-[#fff7f9] rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Record Outflow Expense</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
              <input type="text" value={expenseForm.desc} onChange={(e) => setExpenseForm({ ...expenseForm, desc: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" placeholder="Transport Fuel..." required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount</label>
              <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Debit Account</label>
              <select value={expenseForm.accountId} onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all" required>
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.accountId} value={a.accountId}>{a.accountName}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-sm shadow-rose-600/20">
              Process Outflow
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-[#fff7f9] rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Security & Action Logs</h3>
          <div className="space-y-2">
            {audit.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">No audit logs found.</div>
            ) : audit.map((a) => (
              <div key={a.auditId} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col md:flex-row justify-between text-xs gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold bg-amber-50 text-amber-600">{a.actionName}</span>
                  <span className="text-slate-600 font-semibold ml-2 text-xs">Target: {a.tableName} <span className="text-slate-400 font-mono text-[10px]">(Id: {a.recordId})</span></span>
                </div>
                <div className="text-right">
                  <span className="text-slate-800 font-bold text-xs">@{a.username}</span>
                  <span className="text-slate-400 font-mono text-[10px] tracking-wider block mt-0.5">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-6">
        <button onClick={logout} className="bg-[#fff7f9] hover:bg-slate-50 shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 px-8 py-3 rounded-xl text-xs font-bold transition-all">
          Sign Out of VPMS
        </button>
      </div>
    </div>
  );
}
