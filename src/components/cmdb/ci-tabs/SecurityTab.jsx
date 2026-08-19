import React from "react";
import { InfoRow, Badge2 } from "../CmdbShared";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

const riskColor = (score) => {
  const n = parseInt(score, 10);
  if (isNaN(n)) return "bg-slate-50 text-slate-600 border-slate-200";
  if (n >= 80) return "bg-red-50 text-red-700 border-red-200";
  if (n >= 50) return "bg-orange-50 text-orange-700 border-orange-200";
  if (n >= 20) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

export default function SecurityTab({ ci }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Security Posture</h4>
          <InfoRow label="Defender Risk Score" value={ci.defender_risk_score} icon={ShieldAlert} />
          <InfoRow label="Exposure Level" value={ci.exposure_level} />
          <InfoRow label="Security Status" value={ci.security_status} icon={ShieldCheck} />
          <InfoRow label="Managed / Unmanaged" value={ci.managed_unmanaged} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Management Status</h4>
          <InfoRow label="Defender Onboarding" value={ci.defender_onboarding_status} />
          <InfoRow label="Intune Management" value={ci.intune_management_status} />
          <InfoRow label="Entra Registration" value={ci.entra_registration_status} />
          <InfoRow label="Management Platform" value={ci.management_platform} />
        </div>
      </div>

      {ci.defender_risk_score && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Risk Indicator</h4>
          <Badge2 className={riskColor(ci.defender_risk_score)}>{ci.defender_risk_score} risk score</Badge2>
        </div>
      )}

      {ci.vulnerability_info && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Vulnerability Information</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 border border-amber-200 rounded-lg p-3">{ci.vulnerability_info}</p>
        </div>
      )}

      {!ci.defender_risk_score && !ci.exposure_level && !ci.security_status && !ci.vulnerability_info && (
        <p className="text-sm text-slate-400 italic">No security information available for this CI. Security data is populated by Microsoft Defender for Endpoint discovery (Phase 3).</p>
      )}
    </div>
  );
}