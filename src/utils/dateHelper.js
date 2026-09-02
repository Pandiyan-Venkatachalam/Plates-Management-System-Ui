export const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return '';
  // If string starts with YYYY-MM-DD, parse directly to avoid timezone shift
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.substring(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeDDMMYYYY = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

export const formatDateToYMD = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    fromDate: formatDateToYMD(startOfMonth),
    toDate: formatDateToYMD(now)
  };
};

export const getPresetDateRange = (presetType) => {
  const now = new Date();
  switch (presetType) {
    case 'today':
      return {
        fromDate: formatDateToYMD(now),
        toDate: formatDateToYMD(now)
      };
    case 'month':
    case 'thisMonth':
      return getCurrentMonthRange();
    case 'lastMonth': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        fromDate: formatDateToYMD(startOfLastMonth),
        toDate: formatDateToYMD(endOfLastMonth)
      };
    }
    case 'quarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
      return {
        fromDate: formatDateToYMD(startOfQuarter),
        toDate: formatDateToYMD(now)
      };
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        fromDate: formatDateToYMD(startOfYear),
        toDate: formatDateToYMD(now)
      };
    }
    case 'all':
    default:
      return {
        fromDate: '',
        toDate: ''
      };
  }
};

export const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDateInRange = (dateInput, fromDateStr, toDateStr) => {
  if (!fromDateStr && !toDateStr) return true;
  if (!dateInput) return true;
  const dateStr = getLocalDateString(dateInput);
  if (!dateStr) return true;
  if (fromDateStr && dateStr < fromDateStr) return false;
  if (toDateStr && dateStr > toDateStr) return false;
  return true;
};

