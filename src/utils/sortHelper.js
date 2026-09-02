// Universal Helper to sort items with newest/latest added or updated items first

const getEditedTimestamps = (entityKey) => {
  try {
    const data = sessionStorage.getItem(`vpms_edited_${entityKey}`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const markItemAsUpdated = (entityKey, id) => {
  if (!entityKey || id === undefined || id === null) return;
  try {
    const current = getEditedTimestamps(entityKey);
    current[String(id)] = Date.now();
    sessionStorage.setItem(`vpms_edited_${entityKey}`, JSON.stringify(current));
  } catch (e) {
    console.error('Error recording updated item', e);
  }
};

export const sortLatestFirst = (items, idKeys = ['id'], entityKey = '') => {
  if (!Array.isArray(items)) return [];
  const editedMap = entityKey ? getEditedTimestamps(entityKey) : {};

  return [...items].sort((a, b) => {
    // 1. Check if either item was recently edited in the session
    let editedA = 0;
    let editedB = 0;
    
    for (const key of idKeys) {
      if (a[key] && editedMap[String(a[key])]) editedA = Math.max(editedA, editedMap[String(a[key])]);
      if (b[key] && editedMap[String(b[key])]) editedB = Math.max(editedB, editedMap[String(b[key])]);
    }

    if (editedA !== editedB) {
      return editedB - editedA;
    }

    // 2. Check updatedAt / updatedDate / lastModified / createdAt / dates
    const timeA = new Date(
      a.updatedAt || a.updatedDate || a.lastModified || 
      a.createdAt || a.createdDate || a.saleDate || 
      a.purchaseDate || a.expenseDate || a.receivedDate || 
      a.manufacturingDate || a.transactionDate || a.timestamp || 0
    ).getTime();

    const timeB = new Date(
      b.updatedAt || b.updatedDate || b.lastModified || 
      b.createdAt || b.createdDate || b.saleDate || 
      b.purchaseDate || b.expenseDate || b.receivedDate || 
      b.manufacturingDate || b.transactionDate || b.timestamp || 0
    ).getTime();

    if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA && timeA > 0 && timeB > 0) {
      return timeB - timeA;
    }

    // 3. Fallback to Primary Key ID descending
    for (const key of idKeys) {
      const idA = Number(a[key]) || 0;
      const idB = Number(b[key]) || 0;
      if (idB !== idA) return idB - idA;
    }

    return 0;
  });
};

// Size Extraction and Size-Based Sorting (12" -> 10" -> 8" -> 6" -> ...)
export const extractProductSize = (item) => {
  if (!item) return 0;
  const text = `${item.productName || ''} ${item.variantName || ''} ${item.productCode || ''}`;
  
  // 1. Match size with unit (e.g. 12", 12 inch, 12-inch, 12 in, 12inch, 12'')
  const inchMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|"|''|in\b|-inch)/i);
  if (inchMatch) {
    return parseFloat(inchMatch[1]);
  }
  
  // 2. Match size number in variant or product name
  const numMatch = (item.variantName || '').match(/(\d+(?:\.\d+)?)/) || (item.productName || '').match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }
  
  return 0;
};

export const sortProductsBySizeAndRecency = (items, entityKey = 'product') => {
  if (!Array.isArray(items)) return [];
  const editedMap = entityKey ? getEditedTimestamps(entityKey) : {};

  return [...items].sort((a, b) => {
    // 1. Primary ordering: Plate size descending (12 inch -> 10 inch -> 8 inch -> ...)
    const sizeA = extractProductSize(a);
    const sizeB = extractProductSize(b);
    if (sizeB !== sizeA && (sizeA > 0 || sizeB > 0)) {
      return sizeB - sizeA;
    }

    // 2. Secondary ordering: Recently edited in current session
    const idKeys = ['productId', 'id'];
    let editedA = 0;
    let editedB = 0;
    for (const key of idKeys) {
      if (a[key] && editedMap[String(a[key])]) editedA = Math.max(editedA, editedMap[String(a[key])]);
      if (b[key] && editedMap[String(b[key])]) editedB = Math.max(editedB, editedMap[String(b[key])]);
    }
    if (editedA !== editedB) {
      return editedB - editedA;
    }

    // 3. Tertiary ordering: Updated or created date descending
    const timeA = new Date(
      a.updatedAt || a.updatedDate || a.lastModified || 
      a.createdAt || a.createdDate || 0
    ).getTime();

    const timeB = new Date(
      b.updatedAt || b.updatedDate || b.lastModified || 
      b.createdAt || b.createdDate || 0
    ).getTime();

    if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA && timeA > 0 && timeB > 0) {
      return timeB - timeA;
    }

    // 4. Fallback: Product ID descending
    return (b.productId || b.id || 0) - (a.productId || a.id || 0);
  });
};

export const sortBatchesBySizeAndRecency = (items, entityKey = 'batch') => {
  if (!Array.isArray(items)) return [];
  const editedMap = entityKey ? getEditedTimestamps(entityKey) : {};

  return [...items].sort((a, b) => {
    // 1. Primary ordering: Plate size descending (12 inch -> 10 inch -> 8 inch -> 6 inch ...)
    const sizeA = extractProductSize(a);
    const sizeB = extractProductSize(b);
    if (sizeB !== sizeA && (sizeA > 0 || sizeB > 0)) {
      return sizeB - sizeA;
    }

    // 2. Secondary ordering: Recently edited in current session
    const idKeys = ['batchId', 'id', 'productId'];
    let editedA = 0;
    let editedB = 0;
    for (const key of idKeys) {
      if (a[key] && editedMap[String(a[key])]) editedA = Math.max(editedA, editedMap[String(a[key])]);
      if (b[key] && editedMap[String(b[key])]) editedB = Math.max(editedB, editedMap[String(b[key])]);
    }
    if (editedA !== editedB) {
      return editedB - editedA;
    }

    // 3. Tertiary ordering: Updated or received date descending
    const timeA = new Date(
      a.updatedAt || a.updatedDate || a.lastModified || 
      a.receivedDate || a.createdAt || a.createdDate || 0
    ).getTime();

    const timeB = new Date(
      b.updatedAt || b.updatedDate || b.lastModified || 
      b.receivedDate || b.createdAt || b.createdDate || 0
    ).getTime();

    if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA && timeA > 0 && timeB > 0) {
      return timeB - timeA;
    }

    // 4. Fallback: Batch ID descending
    return (b.batchId || b.id || 0) - (a.batchId || a.id || 0);
  });
};


