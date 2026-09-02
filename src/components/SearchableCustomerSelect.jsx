import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, User } from 'lucide-react';

export default function SearchableCustomerSelect({
  customers = [],
  value = '',
  onChange,
  placeholder = 'Search or Select Customer...',
  required = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Alphabetically sorted customers
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) =>
      (a.customerName || '').localeCompare(b.customerName || '', undefined, { sensitivity: 'base' })
    );
  }, [customers]);

  // Real-time filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return sortedCustomers;
    const q = searchTerm.toLowerCase().trim();
    return sortedCustomers.filter(c =>
      (c.customerName && c.customerName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }, [sortedCustomers, searchTerm]);

  // Current selected customer
  const selectedCustomer = useMemo(() => {
    return customers.find(c => String(c.customerId) === String(value));
  }, [customers, value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (cId) => {
    onChange(cId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border ${
          isOpen
            ? 'border-brand-accent ring-2 ring-brand-accent/20'
            : 'border-slate-200 hover:border-slate-300'
        } rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all select-none shadow-sm`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <User size={15} className={`shrink-0 ${selectedCustomer ? 'text-brand-accent' : 'text-slate-400'}`} />
          {selectedCustomer ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-bold text-slate-900 truncate">
                {selectedCustomer.customerName}
              </span>
              {selectedCustomer.phone && (
                <span className="shrink-0 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-100">
                  {selectedCustomer.phone}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-slate-400 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCustomer && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              title="Clear customer"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-accent' : ''}`}
          />
        </div>
      </div>

      {/* Floating Searchable Menu Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-[#fff7f9] border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-modal-pop backdrop-blur-md">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-[#ffeef1]/60">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customer name or phone..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Customer Items List */}
          <div className="max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-100/60 p-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No customer matching "{searchTerm}"
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = String(c.customerId) === String(value);
                return (
                  <div
                    key={c.customerId}
                    onClick={() => handleSelect(c.customerId)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 text-brand-accent font-black'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {c.customerName}
                      </span>
                      {c.phone && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          📞 {c.phone}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-brand-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
