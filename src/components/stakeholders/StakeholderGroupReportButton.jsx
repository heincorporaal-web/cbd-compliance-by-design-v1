import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows, headers) {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCsv(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StakeholderGroupReportButton({ stakeholders, groups, companies }) {
  const handleDownload = () => {
    const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
    const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
    const date = new Date().toISOString().split("T")[0];

    // ── Sheet 1: All stakeholders with their group assignments ──
    const assignedRows = stakeholders
      .filter(s => s.status !== "inactive")
      .map(s => ({
        "Employee #": s.employee_number || "",
        "Full Name": s.full_name || "",
        "Email": s.email || "",
        "Job Title": s.job_title || "",
        "Department": s.department || "",
        "Company": companyMap[s.company_id] || "",
        "Status": s.status || "",
        "Groups Assigned": (s.group_ids || []).map(id => groupMap[id] || id).join("; ") || "Unassigned",
        "Group Count": (s.group_ids || []).length,
      }));

    const assignedHeaders = [
      "Employee #", "Full Name", "Email", "Job Title",
      "Department", "Company", "Status", "Groups Assigned", "Group Count"
    ];

    // ── Sheet 2: Unassigned stakeholders ──
    const unassignedRows = stakeholders
      .filter(s => s.status !== "inactive" && (!s.group_ids || s.group_ids.length === 0))
      .map(s => ({
        "Employee #": s.employee_number || "",
        "Full Name": s.full_name || "",
        "Email": s.email || "",
        "Job Title": s.job_title || "",
        "Department": s.department || "",
        "Company": companyMap[s.company_id] || "",
        "Status": s.status || "",
      }));

    const unassignedHeaders = [
      "Employee #", "Full Name", "Email", "Job Title", "Department", "Company", "Status"
    ];

    // ── Sheet 3: Groups with their members ──
    const groupRows = [];
    for (const group of groups.filter(g => g.status !== "inactive")) {
      const members = stakeholders.filter(
        s => s.status !== "inactive" && (s.group_ids || []).includes(group.id)
      );
      if (members.length === 0) {
        groupRows.push({
          "Group Name": group.name,
          "Group Description": group.description || "",
          "Company": companyMap[group.company_id] || "All",
          "Is Default": group.is_default ? "Yes" : "No",
          "Member Count": 0,
          "Employee #": "",
          "Member Name": "(No members)",
          "Member Email": "",
          "Member Job Title": "",
          "Member Department": "",
        });
      } else {
        for (const m of members) {
          groupRows.push({
            "Group Name": group.name,
            "Group Description": group.description || "",
            "Company": companyMap[group.company_id] || "All",
            "Is Default": group.is_default ? "Yes" : "No",
            "Member Count": members.length,
            "Employee #": m.employee_number || "",
            "Member Name": m.full_name || "",
            "Member Email": m.email || "",
            "Member Job Title": m.job_title || "",
            "Member Department": m.department || "",
          });
        }
      }
    }

    const groupHeaders = [
      "Group Name", "Group Description", "Company", "Is Default", "Member Count",
      "Employee #", "Member Name", "Member Email", "Member Job Title", "Member Department"
    ];

    // Combine all three sections into one CSV with section headers
    const separator = "\n\n";
    const csv = [
      `STAKEHOLDER GROUP ASSIGNMENT REPORT - ${date}`,
      "",
      "=== SECTION 1: ALL STAKEHOLDERS & GROUP ASSIGNMENTS ===",
      buildCsv(assignedRows, assignedHeaders),
      separator,
      "=== SECTION 2: UNASSIGNED STAKEHOLDERS ===",
      buildCsv(unassignedRows, unassignedHeaders),
      separator,
      "=== SECTION 3: STAKEHOLDER GROUPS & MEMBERS ===",
      buildCsv(groupRows, groupHeaders),
    ].join("\n");

    downloadCsv(csv, `Stakeholder_Group_Report_${date}.csv`);
  };

  return (
    <Button variant="outline" onClick={handleDownload} className="gap-2">
      <Download className="w-4 h-4" />
      Export Report
    </Button>
  );
}