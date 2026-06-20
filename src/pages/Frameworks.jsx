import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Download, CheckCircle2, ChevronRight, Search, Edit2 } from "lucide-react";
import EndDateBadge from "@/components/ui/EndDateBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CustomOptionIcon } from "@/components/ui/EditableOptionSelect";
import { useCustomOptions } from "@/hooks/useCustomOptions";
import { Tag } from "lucide-react";

export default function Frameworks() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [expandedFramework, setExpandedFramework] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const FRAMEWORK_CATEGORY_SEEDED = [
    { value: "information_security", label: "Information Security" },
    { value: "privacy", label: "Privacy" },
    { value: "compliance", label: "Compliance" },
    { value: "operational_risk", label: "Operational Risk" },
    { value: "enterprise_risk", label: "Enterprise Risk" },
    { value: "financial", label: "Financial" },
    { value: "financial_reporting", label: "Financial Reporting" },
    { value: "regulatory", label: "Regulatory" },
    { value: "resilience", label: "Resilience" },
    { value: "process", label: "Process" },
    { value: "quality", label: "Quality" },
    { value: "service_management", label: "Service Management" },
    { value: "software_development", label: "Software Development" },
    { value: "cyber_security", label: "Cyber Security" },
    { value: "3rd_party", label: "3rd Party" },
    { value: "digital_assets", label: "Digital Assets" },
    { value: "fraud", label: "Fraud" },
    { value: "engagement", label: "Engagement" },
    { value: "other", label: "Other" },
  ];
  const { isCustom: isCategoryCustom, getLabel: getCategoryLabelCustom } = useCustomOptions("cbd_framework_categories");
  const getCategoryLabel = (val) => {
    const seeded = FRAMEWORK_CATEGORY_SEEDED.find(o => o.value === val);
    if (seeded) return seeded.label;
    return getCategoryLabelCustom(val);
  };

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
      const iso27001 = await base44.entities.Framework.create({
        name: "ISO 27001",
        version: "2022",
        description: "Information Security Management System standard",
        category: "information_security",
        status: "active"
      });

      const nistCsf = await base44.entities.Framework.create({
        name: "NIST Cybersecurity Framework",
        version: "2.0",
        description: "Framework for improving critical infrastructure cybersecurity",
        category: "information_security",
        status: "active"
      });

      const soc2 = await base44.entities.Framework.create({
        name: "SOC 2",
        version: "2017",
        description: "Service Organization Control for security, availability, processing integrity, confidentiality, and privacy",
        category: "compliance",
        status: "active"
      });

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
      enterprise_risk: 'bg-red-100 text-red-700 border-red-200',
      financial: 'bg-amber-100 text-amber-700 border-amber-200',
      financial_reporting: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      regulatory: 'bg-teal-100 text-teal-700 border-teal-200',
      resilience: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      process: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      quality: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      service_management: 'bg-sky-100 text-sky-700 border-sky-200',
      software_development: 'bg-violet-100 text-violet-700 border-violet-200',
      cyber_security: 'bg-blue-100 text-blue-700 border-blue-200',
      '3rd_party': 'bg-pink-100 text-pink-700 border-pink-200',
      digital_assets: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
      fraud: 'bg-rose-100 text-rose-700 border-rose-200',
      engagement: 'bg-lime-100 text-lime-700 border-lime-200',
      other: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[category] || colors.other;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
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

      {frameworks.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search frameworks and controls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

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
        <div className="space-y-6">
          {frameworks.filter(f => 
            f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            controls.some(c => 
              c.framework_id === f.id && 
              (c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               c.control_id?.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          ).map((framework) => {
            const frameworkControls = controls.filter(c => c.framework_id === framework.id);
            const isExpanded = expandedFramework === framework.id;
            
            return (
              <Card key={framework.id} className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{framework.name}</h3>
                      <p className="text-sm text-slate-500 mb-2">Version {framework.version}</p>
                      <p className="text-sm text-slate-600 mb-3">{framework.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                         <Badge variant="outline" className={`${getCategoryColor(framework.category)} border flex items-center gap-1`}>
                          {getCategoryLabel(framework.category)}
                          {isCategoryCustom(framework.category) && <CustomOptionIcon />}
                        </Badge>
                        <EndDateBadge endDate={framework.end_date} />
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          {frameworkControls.length} controls
                        </div>
                        {framework.tags?.length > 0 && framework.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={createPageUrl(`FrameworkDetail?id=${framework.id}`)}>
                        <Button variant="outline" size="sm">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Collapsible open={isExpanded} onOpenChange={() => setExpandedFramework(isExpanded ? null : framework.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm">
                            {isExpanded ? 'Hide' : 'View'} Controls
                            <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </div>
                  </div>
                </CardHeader>
                
                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {frameworkControls.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                          No controls defined for this framework
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {frameworkControls.map((control) => (
                            <Link
                              key={control.id}
                              to={createPageUrl(`ControlDetail?id=${control.id}`)}
                              className="block p-4 hover:bg-slate-50 transition-colors group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <Badge variant="outline" className="mt-0.5 shrink-0">
                                    {control.control_id}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                                      {control.title}
                                    </h4>
                                    {control.description && (
                                      <p className="text-sm text-slate-600 line-clamp-2">{control.description}</p>
                                    )}
                                    {control.category && (
                                      <p className="text-xs text-slate-500 mt-1">{control.category}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {control.priority && (
                                    <Badge variant="outline" className={`${getPriorityColor(control.priority)} border`}>
                                      {control.priority}
                                    </Badge>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}