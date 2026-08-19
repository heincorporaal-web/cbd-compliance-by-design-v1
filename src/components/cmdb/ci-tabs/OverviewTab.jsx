import React from "react";
import { InfoRow } from "../CmdbShared";
import { Cpu, HardDrive, Network, Cloud, User, MapPin, Building2, Shield } from "lucide-react";

export default function OverviewTab({ ci }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Identity</h4>
        <InfoRow label="CI ID" value={ci.ci_id} icon={Cpu} />
        <InfoRow label="CI Name" value={ci.ci_name} />
        <InfoRow label="Asset Name" value={ci.asset_name} />
        <InfoRow label="Hostname" value={ci.hostname} />
        <InfoRow label="FQDN" value={ci.fqdn} />
        <InfoRow label="CI Class" value={ci.ci_class_name} />
        <InfoRow label="CI Subclass" value={ci.ci_subclass_name} />
        <InfoRow label="Description" value={ci.description} />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Hardware</h4>
        <InfoRow label="Manufacturer" value={ci.manufacturer} icon={HardDrive} />
        <InfoRow label="Model" value={ci.model} />
        <InfoRow label="Serial Number" value={ci.serial_number} />
        <InfoRow label="Hardware Version" value={ci.hardware_version} />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Operating System</h4>
        <InfoRow label="OS Platform" value={ci.os_platform} icon={Cpu} />
        <InfoRow label="OS Version" value={ci.os_version} />
        <InfoRow label="OS Build" value={ci.os_build} />
        <InfoRow label="Architecture" value={ci.architecture} />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ownership & Location</h4>
        <InfoRow label="Technical Owner" value={ci.technical_owner} icon={User} />
        <InfoRow label="Support Team" value={ci.support_team} icon={Building2} />
        <InfoRow label="Business Owner" value={ci.business_owner} />
        <InfoRow label="Location" value={ci.location} icon={MapPin} />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Classification</h4>
        <InfoRow label="Environment" value={ci.environment} icon={Cloud} />
        <InfoRow label="Lifecycle Status" value={ci.lifecycle_status} />
        <InfoRow label="Intrinsic Criticality" value={ci.intrinsic_criticality} icon={Shield} />
        {ci.inherited_criticality && <InfoRow label="Inherited Criticality" value={`${ci.inherited_criticality} (from ${ci.inherited_criticality_from || "—"})`} />}
      </div>
      {ci.notes && (
        <div className="space-y-1 lg:col-span-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{ci.notes}</p>
        </div>
      )}
    </div>
  );
}