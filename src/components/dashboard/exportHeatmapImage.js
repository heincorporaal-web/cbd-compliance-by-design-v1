// Renders the Risk Heatmap data to a canvas and triggers a PNG download.
// Dependency-free (no html2canvas) — we draw the grid manually for reliable output.

function hexToRgb(hex) {
  if (!hex) return { r: 220, g: 38, b: 38 };
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function roundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function exportHeatmapImage({
  rows,
  bands,
  columnTotals,
  totalShown,
  modelName,
  statusLabels = [],
  categoryLabels = [],
}) {
  const PAD = 28;
  const LEFT_W = 230;
  const BAND_W = 84;
  const TOTAL_W = 72;
  const HEAD_H = 52;
  const ROW_H = 42;
  const FOOT_H = 42;
  const TITLE_H = 96;

  const tableW = LEFT_W + bands.length * BAND_W + TOTAL_W;
  const legendH = 64;
  const width = PAD * 2 + tableW;
  const height = PAD + TITLE_H + HEAD_H + Math.max(rows.length, 1) * ROW_H + FOOT_H + legendH + PAD;

  const scale = 2; // hi-dpi
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 18px Nunito, Arial, sans-serif";
  ctx.fillText("Risk Heatmap — by Business Unit & Assessment Model Rating", PAD, PAD + 20);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px Nunito, Arial, sans-serif";
  ctx.fillText(`Model: ${modelName || "—"}`, PAD, PAD + 42);
  ctx.fillText(
    `${bands.length} rating bands · ${totalShown} risks shown`,
    PAD,
    PAD + 60
  );
  if (statusLabels.length)
    ctx.fillText(`Status: ${statusLabels.join(", ")}`, PAD, PAD + 78);
  if (categoryLabels.length)
    ctx.fillText(`Category: ${categoryLabels.join(", ")}`, PAD + tableW / 2, PAD + 78);

  const tableX = PAD;
  const tableY = PAD + TITLE_H;

  // Header row
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(tableX, tableY, tableW, HEAD_H);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 12px Nunito, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Business Unit", tableX + 12, tableY + HEAD_H / 2);

  bands.forEach((b, i) => {
    const cx = tableX + LEFT_W + i * BAND_W;
    const { r, g, b: bb } = hexToRgb(b.color_hex);
    ctx.fillStyle = `rgb(${r}, ${g}, ${bb})`;
    roundedRect(ctx, cx + 14, tableY + HEAD_H / 2 - 6, 12, 12, 3);
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText(b.label, cx + BAND_W / 2 + 8, tableY + HEAD_H / 2);
    ctx.textAlign = "left";
  });
  ctx.fillStyle = "#475569";
  ctx.textAlign = "center";
  ctx.fillText("Total", tableX + LEFT_W + bands.length * BAND_W + TOTAL_W / 2, tableY + HEAD_H / 2);
  ctx.textAlign = "left";

  // Data rows
  const maxCount = Math.max(1, ...rows.flatMap((r) => r.counts));
  rows.forEach((row, ri) => {
    const y = tableY + HEAD_H + ri * ROW_H;
    if (ri % 2) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(tableX, y, tableW, ROW_H);
    }
    ctx.fillStyle = "#1e293b";
    ctx.font = "600 13px Nunito, Arial, sans-serif";
    ctx.fillText(row.name, tableX + 12, y + 18);
    if (row.type) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Nunito, Arial, sans-serif";
      ctx.fillText(row.type, tableX + 12, y + 34);
    }
    row.counts.forEach((count, bi) => {
      const cx = tableX + LEFT_W + bi * BAND_W;
      const { r, g, b } = hexToRgb(bands[bi].color_hex);
      const intensity = count === 0 ? 0 : 0.2 + 0.8 * (count / maxCount);
      const dark = count / maxCount > 0.5;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity.toFixed(2)})`;
      roundedRect(ctx, cx + 8, y + 6, BAND_W - 16, ROW_H - 12, 6);
      ctx.fill();
      ctx.fillStyle = count === 0 ? "#cbd5e1" : dark ? "#ffffff" : "#1e293b";
      ctx.font = "bold 13px Nunito, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(count), cx + BAND_W / 2, y + ROW_H / 2);
      ctx.textAlign = "left";
    });
    // Row total badge
    const tx = tableX + LEFT_W + bands.length * BAND_W;
    ctx.fillStyle = "#1e2937";
    roundedRect(ctx, tx + 10, y + 8, TOTAL_W - 20, ROW_H - 16, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Nunito, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(row.total), tx + TOTAL_W / 2, y + ROW_H / 2);
    ctx.textAlign = "left";
  });

  // Footer totals
  const fy = tableY + HEAD_H + rows.length * ROW_H;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tableX, fy);
  ctx.lineTo(tableX + tableW, fy);
  ctx.stroke();
  ctx.fillStyle = "#334155";
  ctx.font = "bold 13px Nunito, Arial, sans-serif";
  ctx.fillText("Total", tableX + 12, fy + FOOT_H / 2);
  columnTotals.forEach((c, i) => {
    const cx = tableX + LEFT_W + i * BAND_W;
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.fillText(String(c), cx + BAND_W / 2, fy + FOOT_H / 2);
  });
  ctx.fillStyle = "#0f172a";
  ctx.fillText(
    String(totalShown),
    tableX + LEFT_W + bands.length * BAND_W + TOTAL_W / 2,
    fy + FOOT_H / 2
  );
  ctx.textAlign = "left";

  // Legend
  const ly = fy + FOOT_H + 16;
  ctx.fillStyle = "#64748b";
  ctx.font = "11px Nunito, Arial, sans-serif";
  ctx.fillText("Low", tableX, ly + 10);
  [0.2, 0.45, 0.7, 1].forEach((op, i) => {
    ctx.fillStyle = `rgba(220, 38, 38, ${op})`;
    roundedRect(ctx, tableX + 30 + i * 26, ly + 4, 22, 12, 3);
    ctx.fill();
  });
  ctx.fillStyle = "#64748b";
  ctx.fillText("High count", tableX + 30 + 4 * 26 + 6, ly + 10);
  ctx.fillText(
    "Risks mapped to business units via their value chain · rating bands from the selected assessment model",
    tableX,
    ly + 30
  );

  // Download
  const link = document.createElement("a");
  link.download = `risk-heatmap-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}