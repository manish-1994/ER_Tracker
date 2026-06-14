/** Shared utility functions */

export const sanitizeColumnName = (colName: string): string => {
  return colName.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
};

export const getAccessorFromCol = (colName: string): string => {
  return sanitizeColumnName(colName);
};