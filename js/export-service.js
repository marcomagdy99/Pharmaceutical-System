/**
 * @file export-service.js
 * @description Centralized Export & Download Service.
 * Provides unified file download triggering (Blob/Object URL),
 * Excel/CSV data serialization via SheetJS or BOM UTF-8 fallback,
 * and DOM table extraction helpers.
 */

(function (window) {
  "use strict";

  const ExportService = {
    /**
     * Safely triggers an immediate file download in the browser from string content or Blob.
     * Handles Blob creation, temporary anchor lifecycle, and memory cleanup.
     * @param {string|Blob} contentOrBlob - Data content or pre-formed Blob.
     * @param {string} [filename="download.txt"] - Target file name.
     * @param {string} [mimeType="text/plain;charset=utf-8;"] - Content MIME type.
     * @returns {boolean} True if download was initiated.
     */
    downloadBlob(contentOrBlob, filename = "download.txt", mimeType = "text/plain;charset=utf-8;") {
      if (contentOrBlob === null || contentOrBlob === undefined) return false;
      if (typeof window === "undefined" || !window.document) return true;
      try {
        const blob = contentOrBlob instanceof Blob ? contentOrBlob : new Blob([contentOrBlob], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        return true;
      } catch (err) {
        console.warn("ExportService.downloadBlob failed:", err);
        return false;
      }
    },

    /**
     * Exports tabular data to XLSX format if SheetJS is available, or standard UTF-8 CSV with BOM.
     * Supports both (filename, headers, dataRows, sheetName) and (filename, sheetName, dataRows, headers).
     */
    downloadExcelOrCsv(filename, arg2, arg3, arg4 = "Sheet1") {
      let headers, dataRows, sheetName;
      if (Array.isArray(arg2)) {
        headers = arg2;
        dataRows = Array.isArray(arg3) ? arg3 : [];
        sheetName = typeof arg4 === "string" ? arg4 : "Sheet1";
      } else {
        sheetName = typeof arg2 === "string" ? arg2 : "Sheet1";
        dataRows = Array.isArray(arg3) ? arg3 : [];
        headers = Array.isArray(arg4) ? arg4 : [];
      }

      if (typeof window.XLSX !== "undefined" && window.XLSX.utils) {
        const wsData = [headers, ...dataRows];
        const ws = window.XLSX.utils.aoa_to_sheet(wsData);

        const colWidths = headers.map((h, i) => {
          let maxLen = (h ? h.toString().length : 10);
          dataRows.forEach((row) => {
            const cell = row[i];
            if (cell !== null && cell !== undefined) {
              const len = cell.toString().length;
              if (len > maxLen) maxLen = Math.min(len, 50);
            }
          });
          return { wch: Math.max(maxLen + 4, 14) };
        });
        ws["!cols"] = colWidths;

        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
        window.XLSX.writeFile(wb, `${filename}.xlsx`);
        if (typeof window.showToast === "function") {
          window.showToast("Excel file exported successfully (.xlsx)", "success");
        }
      } else {
        // Fallback to UTF-8 CSV with BOM
        const escapeCsv = (val) => {
          const s = val === null || val === undefined ? "" : String(val);
          if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        };
        const csvContent = [
          headers.map(escapeCsv).join(","),
          ...dataRows.map((r) => r.map(escapeCsv).join(","))
        ].join("\r\n");

        this.downloadBlob('\uFEFF' + csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
        if (typeof window.showToast === "function") {
          window.showToast("File exported successfully (.csv)", "success");
        }
      }
    },

    /**
     * Extracts rows from a DOM <table> and triggers an Excel or CSV download.
     * @param {HTMLTableElement|string} tableOrId - Table element or element ID.
     * @param {string} [filename="table-export"] - Export filename.
     */
    exportTable(tableOrId, filename = "table-export") {
      const el = typeof tableOrId === "string" ? document.getElementById(tableOrId) : tableOrId;
      if (!el) return;

      const headers = [];
      const rows = [];

      el.querySelectorAll("thead th").forEach((th) => {
        headers.push(th.innerText.trim());
      });

      el.querySelectorAll("tbody tr").forEach((tr) => {
        const rowData = [];
        tr.querySelectorAll("td").forEach((td) => {
          rowData.push(td.innerText.trim());
        });
        if (rowData.length > 0) rows.push(rowData);
      });

      this.downloadExcelOrCsv(filename, headers, rows);
    }
  };

  // Expose on window and preserve backward compatibility
  window.ExportService = ExportService;
  window.downloadBlob = ExportService.downloadBlob.bind(ExportService);
  window.downloadExcelOrCsv = ExportService.downloadExcelOrCsv.bind(ExportService);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ExportService;
  }
})(typeof window !== "undefined" ? window : global);
