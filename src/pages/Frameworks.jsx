import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Download, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Frameworks() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list('-created_date'),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const loadSampleFrameworks = async () => {
    setLoading(true);
    try {
      // Create ISO 27001 Framework
      const iso27001 = await base44.entities.Framework.create({
        name: "ISO 27001",
        version: "2022",
        description: "Information Security Management System standard",
        category: "information_security",
        status: "active"
      });

      // Create NIST CSF
      const nistCsf = await base44.entities.Framework.create({
        name: "NIST Cybersecurity Framework",
        version: "2.0",
        description: "Framework for improving critical infrastructure cybersecurity",
        category: "information_security",
        status: "active"
      });

      // Create SOC 2
      const soc2 = await base44.entities.Framework.create({
        name: "SOC 2",
        version: "2017",
        description: "Service Organization Control for security, availability, processing integrity, confidentiality, and privacy",
        category: "compliance",
        status: "active"
      });

      // Create sample controls for ISO 27001
      const isoControls = [
        { control_id: "A.5.1", title: "Policies for information security", category: "Organizational controls", priority: "high" },
        { control_id: "A.5.2", title: "Information security roles and responsibilities", category: "Organizational controls", priority: "high" },
        { control_id: "A.5.3", title: "Segregation of duties", category: "Organizational controls", priority: "medium" },
        { control_id: "A.8.1", title: "User endpoint devices", category: "Technological controls", priority: "high" },
        { control_id: "A.8.2", title: "Privileged access rights", category: "Technological controls", priority: "critical" },
        { control_id: "A.8.3", title: "Information access restriction", category: "Technological controls", priority: "high" },
        { control_id: "A.8.4", title: "Access to source code", category: "Technological controls", priority: "medium" },
        { control_id: "A.8.5", title: "Secure authentication", category: "Technological controls", priority: "critical" }
      ];

      for (const control of isoControls) {
        await base44.entities.Control.create({
          framework_id: iso27001.id,
          ...control,
          description: `Control description for ${control.title}`
        });
      }

      // Create sample controls for NIST CSF
      const nistControls = [
        { control_id: "ID.AM-1", title: "Physical devices and systems inventoried", category: "Identify", priority: "high" },
        { control_id: "ID.AM-2", title: "Software platforms and applications inventoried", category: "Identify", priority: "high" },
        { control_id: "PR.AC-1", title: "Identities and credentials managed", category: "Protect", priority: "critical" },
        { control_id: "PR.AC-3", title: "Remote access managed", category: "Protect", priority: "high" },
        { control_id: "DE.CM-1", title: "Network monitored", category: "Detect", priority: "high" },
        { control_id: "RS.RP-1", title: "Response plan executed", category: "Respond", priority: "critical" },
        { control_id: "RC.RP-1", title: "Recovery plan executed", category: "Recover", priority: "critical" }
      ];

      for (const control of nistControls) {
        await base44.entities.Control.create({
          framework_id: nistCsf.id,
          ...control,
          description: `Control description for ${control.title}`
        });
      }

      // Create sample controls for SOC 2
      const soc2Controls = [
        { control_id: "CC1.1", title: "COSO Principle 1", category: "Common Criteria", priority: "high" },
        { control_id: "CC2.1", title: "COSO Principle 13", category: "Common Criteria", priority: "high" },
        { control_id: "CC6.1", title: "Logical and Physical Access Controls", category: "Common Criteria", priority: "critical" },
        { control_id: "CC7.1", title: "System Operations", category: "Common Criteria", priority: "high" },
        { control_id: "A1.1", title: "Availability Commitments", category: "Availability", priority: "high" },
        { control_id: "PI1.1", title: "Processing Integrity Commitments", category: "Processing Integrity", priority: "medium" }
      ];

      for (const control of soc2Controls) {
        await base44.entities.Control.create({
          framework_id: soc2.id,
          ...control,
          description: `Control description for ${control.title}`
        });
      }

      queryClient.invalidateQueries(['frameworks']);
      queryClient.invalidateQueries(['controls']);
      toast.success("Sample frameworks loaded successfully!");
    } catch (error) {
      toast.error("Error loading frameworks");
      console.error(error);
    }
    setLoading(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      information_security: 'bg-blue-100 text-blue-700 border-blue-200',
      privacy: 'bg-purple-100 text-purple-700 border-purple-200',
      compliance: 'bg-green-100 text-green-700 border-green-200',
      operational_risk: 'bg-orange-100 text-orange-700 border-orange-200',
      financial: 'bg-amber-100 text-amber-700 border-amber-200',
      other: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Risk Frameworks</h1>
          <p className="text-slate-600">Manage compliance frameworks and controls</p>
        </div>
        {frameworks.length === 0 && (
          <Button 
            onClick={loadSampleFrameworks} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Loading..." : "Load Sample Frameworks"}
          </Button>
        )}
      </div>

      {frameworks.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Frameworks Loaded</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Get started by loading popular risk management frameworks like ISO 27001, NIST CSF, and SOC 2
            </p>
            <Button onClick={loadSampleFrameworks} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Loading Frameworks..." : "Load Sample Frameworks"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {frameworks.map((framework) => {
            const frameworkControls = controls.filter(c => c.framework_id === framework.id);
            return (
              <Card key={framework.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{framework.name}</h3>
                      <p className="text-sm text-slate-500">Version {framework.version}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600 mb-4">{framework.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${getCategoryColor(framework.category)} border`}>
                      {framework.category.replace(/_/g, ' ')}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {frameworkControls.length} controls
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}