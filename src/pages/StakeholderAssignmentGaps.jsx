import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  ShieldAlert, RefreshCw, Trash2, Search, Camera, ArrowRight, AlertTriangle, CheckCircle2, FileWarning,
} from "lucide-react";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { useIsAuditRole } from "@/hooks/useIsAuditRole";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";

// Entity types that can be linked to an Issue (per the Issue schema enum).
const LINKABLE_TYPES = new Set(["Risk", "Control", "ICTSystem", "OrgProcess", "ThirdPartyProvider"]);
const gapKey = (g) => `${g.entity_type}|${g.entity_id}|${g.field_label}|${g.stakeholder_id}`;

const snapshotKey = (userId, companyId) =>
  `cbd_stakeholder_gaps_${userId || "guest"}_${companyId || "all"}`;

const critStyle = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function StakeholderAssignmentGaps() {
  const [companyId] = useCompanyFilter();
  const { isAudit, isLoading: roleLoading } = useIsAuditRole();
  const [userId, setUserId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [snapTs, setSnapTs] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [creating, setCreating] = useState(false);
  const [createdKeys, setCreatedKeys] = useState(() => new Set());

  useEffect(() => {
    base44.auth.me().then((u) => { if (u) setUserId(u.id); }).catch(() => {});
  }, []);

  const key = snapshotKey(userId, companyId);

  // Load the persisted snapshot on mount and whenever the company/user changes,
  // so returning to the page does not re-run the scan.
  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setResult(parsed.result || null);
        setSnapTs(parsed.ts || null);
        setCreatedKeys(new Set(parsed.created_keys || []));
      } else {
        setResult(null);
        setSnapTs(null);
        setCreatedKeys(new Set());
      }
    } catch {
      setResult(null);
      setSnapTs(null);
      setCreatedKeys(new Set());
    }
    setSelected(new Set());
  }, [key, userId]);

  const persistCreated = (next) => {
    setCreatedKeys(next);
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem(key, JSON.stringify({
        ...parsed,
        result: parsed.result || null,
        ts: parsed.ts || null,
        created_keys: Array.from(next),
      }));
    } catch { /* ignore */ }
  };

  const toggleGap = (g, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = gapKey(g);
      if (checked) next.add(k); else next.delete(k);
      return next;
    });
  };

  const toggleAll = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const g of filtered) {
        if (!LINKABLE_TYPES.has(g.entity_type)) continue;
        if (createdKeys.has(gapKey(g))) continue;
        const k = gapKey(g);
        if (checked) next.add(k); else next.delete(k);
      }
      return next;
    });
  };

  const createIssues = async () => {
    const chosen = allGaps.filter((g) =>
      selected.has(gapKey(g)) && LINKABLE_TYPES.has(g.entity_type) && !createdKeys.has(gapKey(g))
    );
    if (chosen.length === 0) {
      toast.error("Select at least one linkable gap that hasn't already had an issue created");
      return;
    }
    setCreating(true);
    try {
      const res = await base44.functions.invoke("createIssuesFromGaps", { gaps: chosen });
      const data = res.data ?? res;
      const newCreated = new Set(createdKeys);
      for (const g of chosen) newCreated.add(gapKey(g));
      persistCreated(newCreated);
      setSelected(new Set());
      toast.success(
        `Created ${data.created_count} issue${data.created_count !== 1 ? "s" : ""}` +
          (data.skipped_count ? ` · ${data.skipped_count} skipped` : "")
      );
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Could not create issues");
    } finally {
      setCreating(false);
    }
  };

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await base44.functions.invoke("findStakeholderAssignmentGaps", {
        company_id: companyId,
      });
      const data = res.data ?? res;
      setResult(data);
      const ts = new Date().toISOString();
      setSnapTs(ts);
      localStorage.setItem(key, JSON.stringify({ result: data, ts }));
      toast.success(
        `Found ${data.gap_count} assignment gap${data.gap_count !== 1 ? "s" : ""}`
      );
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const clearSnapshot = () => {
    localStorage.removeItem(key);
    setResult(null);
    setSnapTs(null);
  };

  if (roleLoading) {
    return <div className="p-8 text-slate-500">Checking access…</div>;
  }

  if (isAudit) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Not available</h2>
            <p className="text-slate-500 mt-1">
              The Assignment Gap Finder is restricted to non-audit roles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allGaps = result?.gaps || [];
  const filtered = allGaps.filter(
    (g) =>
      (filter === "all" || g.criticality === filter) &&
      (!search ||
        g.stakeholder_name?.toLowerCase().includes(search.toLowerCase()) ||
        g.entity_label?.toLowerCase().includes(search.toLowerCase()) ||
        g.field_label?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader
          navItemId="stakeholder_assignment_gaps"
          icon={ShieldAlert}
          title="Assignment Gap Finder"
          tagline="Find stakeholders who have been end-dated but are still assigned to records"
          gradient="from-amber-500 to-orange-600"
        />
        <div className="flex gap-2 flex-wrap items-center">
          {snapTs && (
            <span className="text-xs text-slate-500 flex items-center gap-1.5 mr-1">
              <Camera className="w-3.5 h-3.5" />
              Snapshot from {new Date(snapTs).toLocaleString("en-GB")}
            </span>
          )}
          {result && (
            <Button variant="outline" size="sm" onClick={clearSnapshot}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear snapshot
            </Button>
          )}
          <Button onClick={runScan} disabled={scanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning…" : result ? "Run fresh scan" : "Run scan"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {result ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Assignment gaps" value={result.gap_count} icon={<AlertTriangle className="w-5 h-5 text-slate-500" />} />
          <StatCard label="High criticality" value={result.high_count} icon={<ShieldAlert className="w-5 h-5 text-red-500" />} accent="text-red-600" />
          <StatCard label="Medium criticality" value={result.medium_count} icon={<ShieldAlert className="w-5 h-5 text-amber-500" />} accent="text-amber-600" />
          <StatCard label="End-dated stakeholders" value={result.end_dated_count} icon={<AlertTriangle className="w-5 h-5 text-slate-500" />} />
        </div>
      ) : (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
          <CardContent className="p-10 text-center">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              No snapshot yet. Run a scan to find assignment gaps left by end-dated stakeholders.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters + list */}
      {result && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by stakeholder, record or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {["all", "High", "Medium"].map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={filter === c ? "default" : "outline"}
                  onClick={() => setFilter(c)}
                >
                  {c === "all" ? "All" : `${c} only`}
                </Button>
              ))}
            </div>
            {(() => {
              const linkableFiltered = filtered.filter(
                (g) => LINKABLE_TYPES.has(g.entity_type) && !createdKeys.has(gapKey(g))
              );
              const allChecked = linkableFiltered.length > 0 &&
                linkableFiltered.every((g) => selected.has(gapKey(g)));
              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(!allChecked)}
                  disabled={linkableFiltered.length === 0}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {allChecked ? "Deselect all" : "Select all"}
                </Button>
              );
            })()}
            <Button
              size="sm"
              onClick={createIssues}
              disabled={creating || selected.size === 0}
            >
              <FileWarning className="w-4 h-4 mr-2" />
              {creating
                ? "Creating…"
                : `Create ${selected.size > 0 ? selected.size : ""} issue${selected.size === 1 ? "" : "s"}`}
            </Button>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-10 text-center text-slate-500">
                No assignment gaps match the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((g, i) => {
                const k = gapKey(g);
                const linkable = LINKABLE_TYPES.has(g.entity_type);
                const alreadyCreated = createdKeys.has(k);
                const isSelected = selected.has(k);
                return (
                  <Card key={i} className={`border-none shadow-sm hover:shadow-md transition-shadow ${alreadyCreated ? "opacity-70" : ""}`}>
                    <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary disabled:opacity-40"
                          disabled={!linkable || alreadyCreated}
                          checked={isSelected}
                          onChange={(e) => toggleGap(g, e.target.checked)}
                          title={!linkable ? "Issues cannot be linked to this record type" : alreadyCreated ? "Issue already created for this gap" : ""}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge className={`border ${critStyle[g.criticality]}`}>
                              {g.criticality}
                            </Badge>
                            <span className="font-semibold text-slate-900">
                              {g.stakeholder_name}
                            </span>
                            {g.end_date && (
                              <span className="text-xs text-slate-500">
                                end-dated {g.end_date}
                              </span>
                            )}
                            {alreadyCreated && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" /> Issue created
                              </span>
                            )}
                            {!linkable && !alreadyCreated && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                Not linkable to an issue
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            Still assigned as <span className="font-medium">{g.field_label}</span> on{" "}
                            <span className="font-medium">{g.entity_label}</span>
                            <span className="text-slate-400"> ({g.entity_type})</span>
                          </p>
                          {g.group_names?.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {g.group_names.map((n) => (
                                <span key={n} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Link to={g.record_url}>
                        <Button variant="outline" size="sm">
                          Open record <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${accent || "text-slate-900"}`}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}