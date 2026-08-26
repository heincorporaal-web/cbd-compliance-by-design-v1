import { base44 } from "@/api/base44Client";

const CATEGORY_LABELS = {
  implementation_guide: "Implementation Guide",
  best_practice: "Best Practice",
  policy_template: "Policy Template",
  procedure: "Procedure",
  checklist: "Checklist",
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderArticleHtml(article, frameworkName) {
  const steps = (article.key_steps || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const stepsHtml = steps.length
    ? `<div class="section">
        <h2>Key Steps</h2>
        <ol class="steps">
          ${steps
            .map(
              (s) => `
            <li>
              <div class="step-head">
                <span class="step-num">${escapeHtml(s.order ?? "")}</span>
                ${s.reference_number ? `<span class="step-ref">${escapeHtml(s.reference_number)}</span>` : ""}
              </div>
              <div class="step-body">
                <p class="step-title">${escapeHtml(s.step)}</p>
                ${s.description ? `<p class="step-desc">${escapeHtml(s.description)}</p>` : ""}
                ${
                  s.expected_artefacts?.length
                    ? `<div class="artefacts"><span class="artefacts-label">Expected artefacts:</span> ${s.expected_artefacts
                        .map((a) => `<span class="artefact">${escapeHtml(a)}</span>`)
                        .join("")}</div>`
                    : ""
                }
              </div>
            </li>`
            )
            .join("")}
        </ol>
      </div>`
    : "";

  const tagsHtml = article.tags?.length
    ? `<div class="tags">${article.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";

  return `
    <article class="article">
      <header class="article-header">
        <div class="article-meta">
          ${article.reference_number ? `<span class="ref-num">${escapeHtml(article.reference_number)}</span>` : ""}
          ${article.category ? `<span class="cat-badge">${escapeHtml(CATEGORY_LABELS[article.category] || article.category)}</span>` : ""}
          ${article.status ? `<span class="status-badge status-${escapeHtml(article.status)}">${escapeHtml(article.status)}</span>` : ""}
        </div>
        <h1>${escapeHtml(article.title)}</h1>
        ${frameworkName ? `<p class="framework-name">Framework: ${escapeHtml(frameworkName)}</p>` : ""}
        ${article.chapter ? `<p class="chapter">Chapter / Domain: ${escapeHtml(article.chapter)}</p>` : ""}
      </header>

      ${article.description ? `<div class="section"><h2>Description</h2><p>${escapeHtml(article.description)}</p></div>` : ""}

      ${stepsHtml}

      ${article.content ? `<div class="section"><h2>Content</h2><div class="content-body">${escapeHtml(article.content)}</div></div>` : ""}

      ${tagsHtml}
    </article>
  `;
}

function buildPrintDocument({ title, subtitle, articles, userEmail }) {
  const generatedOn = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const articlesHtml = articles
    .map(
      (a, i) =>
        `<div class="article-wrap${i === 0 ? " first" : ""}">${renderArticleHtml(
          a,
          a._frameworkName
        )}</div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page {
    size: A4;
    margin: 22mm 18mm 24mm 18mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Nunito', 'Segoe UI', Arial, sans-serif;
    color: #1e293b;
    background: #fff;
  }
  /* Fixed watermark — repeats on every printed page */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    z-index: 0;
    pointer-events: none;
    font-size: 64pt;
    font-weight: 700;
    letter-spacing: 2px;
    color: rgba(99, 102, 241, 0.07);
    white-space: nowrap;
    user-select: none;
  }
  /* Fixed header + footer — repeat on every printed page */
  .page-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 14mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    font-size: 9pt;
    color: #64748b;
    padding: 0 2mm;
    z-index: 2;
  }
  .page-header .brand { font-weight: 700; color: #4f46e5; }
  .page-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 14mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #e2e8f0;
    font-size: 8.5pt;
    color: #64748b;
    padding: 0 2mm;
    z-index: 2;
  }
  .page-footer .email { font-weight: 600; color: #334155; }

  .content {
    position: relative;
    z-index: 1;
    padding-top: 4mm;
  }
  .doc-title {
    font-size: 20pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px 0;
  }
  .doc-subtitle {
    font-size: 11pt;
    color: #64748b;
    margin: 0 0 16px 0;
  }
  .doc-meta {
    font-size: 9pt;
    color: #94a3b8;
    margin: 0 0 24px 0;
  }

  .article-wrap {
    page-break-before: always;
  }
  .article-wrap.first {
    page-break-before: avoid;
  }
  .article {
    margin-bottom: 8mm;
  }
  .article-header h1 {
    font-size: 16pt;
    margin: 6px 0 4px 0;
    color: #0f172a;
  }
  .article-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .ref-num {
    font-family: monospace;
    font-size: 9pt;
    background: #eef2ff;
    color: #4338ca;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .cat-badge, .status-badge {
    font-size: 8.5pt;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
  }
  .cat-badge { background: #e0e7ff; color: #4338ca; }
  .status-badge { background: #f1f5f9; color: #475569; }
  .status-badge.status-published { background: #dcfce7; color: #166534; }
  .status-badge.status-draft { background: #f1f5f9; color: #475569; }
  .status-badge.status-archived { background: #e2e8f0; color: #64748b; }
  .framework-name, .chapter {
    font-size: 10pt;
    color: #475569;
    margin: 2px 0;
  }

  .section { margin-top: 12px; }
  .section h2 {
    font-size: 12pt;
    color: #312e81;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
    margin: 0 0 8px 0;
  }
  .content-body { white-space: pre-wrap; font-size: 10.5pt; line-height: 1.5; }

  ol.steps { list-style: none; padding: 0; margin: 0; }
  ol.steps li {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px dashed #e2e8f0;
  }
  .step-head { flex-shrink: 0; width: 46px; text-align: center; }
  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: #4f46e5;
    color: #fff;
    border-radius: 50%;
    font-size: 9pt;
    font-weight: 700;
  }
  .step-ref {
    display: block;
    font-family: monospace;
    font-size: 7.5pt;
    color: #4f46e5;
    margin-top: 3px;
  }
  .step-body { flex: 1; }
  .step-title { font-weight: 600; margin: 0 0 2px 0; font-size: 10.5pt; }
  .step-desc { margin: 0; color: #475569; font-size: 9.5pt; }
  .artefacts { margin-top: 4px; }
  .artefacts-label { font-size: 8.5pt; color: #64748b; font-weight: 600; }
  .artefact {
    display: inline-block;
    font-size: 8.5pt;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
    border-radius: 999px;
    padding: 1px 7px;
    margin: 2px 3px 0 0;
  }

  .tags { margin-top: 10px; }
  .tag {
    display: inline-block;
    font-size: 8.5pt;
    background: #eef2ff;
    color: #4338ca;
    border-radius: 999px;
    padding: 2px 8px;
    margin: 2px 4px 0 0;
  }

  @media print {
    .no-print { display: none !important; }
  }
  .print-bar {
    position: sticky;
    top: 0;
    background: #4f46e5;
    color: #fff;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'Segoe UI', Arial, sans-serif;
    z-index: 10;
  }
  .print-bar button {
    background: #fff;
    color: #4f46e5;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 8px;
  }
  .print-bar button.close-btn { background: transparent; color: #fff; }
</style>
</head>
<body>
  <div class="watermark">Compliance By Design</div>
  <div class="page-header">
    <span class="brand">Compliance By Design</span>
    <span>${escapeHtml(generatedOn)}</span>
  </div>
  <div class="page-footer">
    <span>Confidential — for internal use</span>
    <span class="email">${escapeHtml(userEmail || "")}</span>
  </div>

  <div class="print-bar no-print">
    <span>Print preview — use the print dialog to save as PDF or print.</span>
    <div>
      <button onclick="window.print()">Print</button>
      <button class="close-btn" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="content">
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="doc-subtitle">${escapeHtml(subtitle)}</p>` : ""}
    <p class="doc-meta">Generated ${escapeHtml(generatedOn)} · ${articles.length} article${articles.length === 1 ? "" : "s"}</p>
    ${articlesHtml}
  </div>
</body>
</html>`;
}

async function getUserEmail() {
  try {
    const me = await base44.auth.me();
    return me?.email || "";
  } catch {
    return "";
  }
}

export async function printKnowledgeArticle(article, frameworkName) {
  const userEmail = await getUserEmail();
  const title = article.title || "Knowledge Article";
  const html = buildPrintDocument({
    title,
    subtitle: frameworkName ? `Framework: ${frameworkName}` : article.chapter || "",
    articles: [{ ...article, _frameworkName: frameworkName }],
    userEmail,
  });
  openPrintWindow(html);
}

export async function printFrameworkImplementation(framework, articles) {
  const userEmail = await getUserEmail();
  const isNoFramework = framework.id === "__none__";
  const fwArticles = articles
    .filter((a) => (isNoFramework ? !a.framework_id : a.framework_id === framework.id))
    .sort((a, b) => (a.chapter || "").localeCompare(b.chapter || "") || (a.reference_number || "").localeCompare(b.reference_number || ""));
  const title = framework.name || "Framework Implementation";
  const html = buildPrintDocument({
    title,
    subtitle: `Full implementation guide — ${fwArticles.length} article${fwArticles.length === 1 ? "" : "s"}`,
    articles: fwArticles.map((a) => ({ ...a, _frameworkName: framework.name })),
    userEmail,
  });
  openPrintWindow(html);
}

function openPrintWindow(html) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow pop-ups to print the knowledge article.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the new document a moment to lay out before triggering print
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  };
}