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
      if (typeof window === "undefined" || !window.document) return false;
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
        }, 1000);
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

      // 1. Clean filename to avoid duplicate extensions like report.xlsx.xlsx or report.csv.xlsx
      const cleanFilename = String(filename || "export").replace(/\.(xlsx|csv|txt)$/i, "");

      // 2. Sanitize Sheet Name for Excel / SheetJS (max 31 characters, no forbidden characters : \ / ? * [ ])
      const safeSheetName = String(sheetName || "Sheet1")
        .replace(/[:\\/?*\[\]]/g, "_")
        .trim()
        .slice(0, 31) || "Sheet1";

      const sanitizeFormulaCell = (val) => {
        if (val === null || val === undefined) return "";
        if (typeof val === "number" || typeof val === "boolean") return val;
        const s = String(val);
        const trimmed = s.trimStart();
        if (/^[=@\t\r]/.test(trimmed) || (/^[+-]/.test(trimmed) && !/^[+-]?\d+(\.\d+)?$/.test(trimmed))) {
          return "'" + s;
        }
        return s;
      };

      // Fallback CSV generator function (used when XLSX unavailable or on SheetJS error)
      const triggerCsvFallback = () => {
        const escapeCsv = (val) => {
          const s = String(sanitizeFormulaCell(val));
          if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r") || s.startsWith("'")) {
            return '"' + s.replace(/"/g, '""') + '"';
          }
          return s;
        };
        const csvContent = [
          headers.map(escapeCsv).join(","),
          ...dataRows.map((r) => r.map(escapeCsv).join(","))
        ].join("\r\n");

        this.downloadBlob('\uFEFF' + csvContent, `${cleanFilename}.csv`, "text/csv;charset=utf-8;");
        if (typeof window.showToast === "function") {
          window.showToast("File exported successfully (.csv)", "success");
        }
      };

      if (typeof window.XLSX !== "undefined" && window.XLSX.utils) {
        try {
          const sanitizedDataRows = dataRows.map((row) =>
            Array.isArray(row) ? row.map(sanitizeFormulaCell) : row
          );
          const wsData = [headers.map(sanitizeFormulaCell), ...sanitizedDataRows];
          const ws = window.XLSX.utils.aoa_to_sheet(wsData);

          const colWidths = headers.map((h, i) => {
            let maxLen = (h ? h.toString().length : 10);
            sanitizedDataRows.forEach((row) => {
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
          window.XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
          window.XLSX.writeFile(wb, `${cleanFilename}.xlsx`);
          if (typeof window.showToast === "function") {
            window.showToast("Excel file exported successfully (.xlsx)", "success");
          }
        } catch (xlsxErr) {
          console.warn("SheetJS XLSX export failed, falling back to CSV:", xlsxErr);
          triggerCsvFallback();
        }
      } else {
        triggerCsvFallback();
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

      const ignoredColIndices = new Set();
      const headers = [];
      const rows = [];

      // Accurately map headers taking colspan into account
      const thList = Array.from(el.querySelectorAll("thead th"));
      let headerColIndex = 0;
      thList.forEach((th) => {
        const span = parseInt(th.getAttribute("colspan") || "1", 10);
        const txt = th.innerText.trim().toLowerCase();
        const isAction = th.classList.contains("table-actions-cell") ||
          th.classList.contains("actions-cell") ||
          th.classList.contains("area-actions-cell") ||
          txt === "actions" || txt === "action" || txt === "الإجراءات" || txt === "إجراءات";

        for (let i = 0; i < span; i++) {
          if (isAction) {
            ignoredColIndices.add(headerColIndex + i);
          }
        }
        if (!isAction) {
          headers.push(th.innerText.trim());
        }
        headerColIndex += span;
      });

      el.querySelectorAll("tbody tr").forEach((tr) => {
        const tdList = Array.from(tr.querySelectorAll("td"));
        // Skip empty placeholder / "no data" rows (often single cell with colspan)
        if (tdList.length === 1 && (tdList[0].hasAttribute("colspan") || tdList[0].closest(".empty-state") || tr.classList.contains("empty-state-row") || tdList[0].innerText.toLowerCase().includes("no data") || tdList[0].innerText.toLowerCase().includes("no records"))) {
          return;
        }

        const rowData = [];
        let colIndex = 0;
        tdList.forEach((td) => {
          const span = parseInt(td.getAttribute("colspan") || "1", 10);
          const isIgnored = ignoredColIndices.has(colIndex) ||
            td.classList.contains("table-actions-cell") ||
            td.classList.contains("actions-cell") ||
            td.classList.contains("area-actions-cell");

          if (!isIgnored) {
            rowData.push(td.innerText.trim());
          }
          colIndex += span;
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
