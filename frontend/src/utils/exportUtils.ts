import * as XLSX from "xlsx";

export type ExportColumn = {
  header: string;
  accessor: string;
};

/**
 * Export worksheet row dataset to standard XLSX format.
 */
export const exportToExcel = (
  sheetName: string,
  columns: ExportColumn[],
  data: any[],
  filename: string = "export.xlsx"
) => {
  const formatted = data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      const rowVal = row.data?.[col.accessor];
      obj[col.header] = rowVal !== undefined && rowVal !== null ? rowVal : "";
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31)); // sheet names capped at 31 chars
  XLSX.writeFile(workbook, filename);
};

/**
 * Export worksheet row dataset to standard CSV format.
 */
export const exportToCSV = (
  sheetName: string,
  columns: ExportColumn[],
  data: any[],
  filename: string = "export.csv"
) => {
  const formatted = data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      const rowVal = row.data?.[col.accessor];
      obj[col.header] = rowVal !== undefined && rowVal !== null ? rowVal : "";
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Trigger print dialog with clean layout rules for PDF conversion.
 */
export const exportToPDF = () => {
  window.print();
};
