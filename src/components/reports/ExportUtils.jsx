/**
 * Shared export utilities for data reports (CSV / PDF via print).
 */

export function exportCSV(rows, fields, filename, classification = "") {
  const classLine = classification ? `"Classification: ${classification}"\n` : "";
  const header = fields.map(f => `"${f.label}"`).join(",");
  const lines = rows.map(row =>
    fields.map(f => {
      const val = row[f.key] ?? "";
      const str = Array.isArray(val) ? val.join("; ") : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = classLine + [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildPrintHTML(rows, fields, title, options = {}) {
  const { classification = "", classificationColor = "#dc2626", branding = {} } = options;
  const { primaryColor = "#1e3a5f", headerText = "", footerText = "", logoUrl = "", includeLogoInReports = true } = branding;

  const th = fields.map(f => `<th>${f.label}</th>`).join("");
  const trs = rows.map(row => {
    const tds = fields.map(f => {
      const val = row[f.key] ?? "";
      const str = Array.isArray(val) ? val.join("; ") : String(val);
      return `<td>${str}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  const logoHtml = includeLogoInReports && logoUrl
    ? `<img src="${logoUrl}" alt="logo" style="height:36px;object-fit:contain;margin-right:12px;" />`
    : "";

  const classificationBadge = classification
    ? `<span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;background:${classificationColor};letter-spacing:0.05em;">${classification}</span>`
    : "";

  const footerHtml = footerText
    ? `<div class="footer">${footerText}${classification ? ` &nbsp;|&nbsp; ${classification}` : ""}</div>`
    : classification ? `<div class="footer">${classification}</div>` : "";

  return `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; color: #1e293b; }
    .report-header { background: ${primaryColor}; color: white; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
    .report-header .left { display: flex; align-items: center; }
    .report-header h1 { font-size: 15px; margin: 0; color: white; font-weight: 700; }
    .meta { padding: 10px 20px 6px; display: flex; align-items: center; justify-content: space-between; }
    .meta p { font-size: 10px; color: #64748b; margin: 0; }
    table { border-collapse: collapse; width: 100%; margin-top: 8px; }
    th { background: ${primaryColor}; color: white; padding: 7px 10px; text-align: left; font-size: 10px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 16px; padding: 8px 20px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    @media print { button { display: none; } }
  </style></head><body>
  <div class="report-header">
    <div class="left">${logoHtml}<h1>${headerText || title}</h1></div>
    <div>${classificationBadge}</div>
  </div>
  <div class="meta">
    <p>${title} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; ${rows.length} records</p>
  </div>
  <table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>
  ${footerHtml}
  </body></html>`;
}

export function exportPDF(rows, fields, title, options = {}) {
  const html = buildPrintHTML(rows, fields, title, options);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

function escapeXml(str) {
  return String(str ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

/**
 * Exports rows as a real Excel-readable file (.xls HTML spreadsheet) — no library needed.
 * `columns` is an array of { key, label }. Nested values are flattened to strings.
 */
export function exportExcel(rows, columns, filename, options = {}) {
  const { title = "Report", branding = {} } = options;
  const { primaryColor = "#1e3a5f" } = branding;

  const ths = columns.map(c => `<th>${escapeXml(c.label)}</th>`).join("");
  const trs = rows.map(row =>
    `<tr>${columns.map(c => {
      const val = row[c.key] ?? "";
      const str = Array.isArray(val) ? val.join("; ") : String(val);
      return `<td style="mso-number-format:'\\@'">${escapeXml(str)}</td>`;
    }).join("")}</tr>`
  ).join("");

  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeXml(title)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1"><thead><tr style="background:${primaryColor};color:#fff;font-weight:bold;">${ths}</tr></thead><tbody>${trs}</tbody></table></body></html>`;

  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}