/**
 * Shared export utilities for data reports (CSV / PDF via print).
 */

export function exportCSV(rows, fields, filename) {
  const header = fields.map(f => `"${f.label}"`).join(",");
  const lines = rows.map(row =>
    fields.map(f => {
      const val = row[f.key] ?? "";
      const str = Array.isArray(val) ? val.join("; ") : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildPrintHTML(rows, fields, title) {
  const th = fields.map(f => `<th>${f.label}</th>`).join("");
  const trs = rows.map(row => {
    const tds = fields.map(f => {
      const val = row[f.key] ?? "";
      const str = Array.isArray(val) ? val.join("; ") : String(val);
      return `<td>${str}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #1e293b; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.sub { font-size: 11px; color: #64748b; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #1e3a5f; color: white; padding: 7px 10px; text-align: left; font-size: 10px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { button { display: none; } }
  </style></head><body>
  <h1>${title}</h1>
  <p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; ${rows.length} records</p>
  <table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>
  </body></html>`;
}

export function exportPDF(rows, fields, title) {
  const html = buildPrintHTML(rows, fields, title);
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}