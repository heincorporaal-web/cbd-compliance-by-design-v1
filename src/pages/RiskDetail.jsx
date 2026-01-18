import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, X, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function RiskDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const riskId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';
  const queryClient = useQueryClient();

  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);

  const { data: risk } = useQuery({
    queryKey: ['risk', riskId],
    queryFn: () => base44.entities.Risk.filter({ id: riskId }).then(res => res[0]),
    enabled: !!riskId && !isNew,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company_id: "",
    category: "operational",
    likelihood: "medium",
    impact: "medium",
    status: "identified",
    owner: "",
    control_ids: [],
    framework_ids: [],
    mitigation_plan: "",
    review_date: "",
    identified_date: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    if (risk) {
      setFormData({
        title: risk.title || "",
        description: risk.description || "",
        company_id: risk.company_id || "",
        category: risk.category || "operational",
        likelihood: risk.likelihood || "medium",
        impact: risk.impact || "medium",
        status: risk.status || "identified",
        owner: risk.owner || "",
        control_ids: risk.control_ids || [],
        framework_ids: risk.framework_ids || [],
        mitigation_plan: risk.mitigation_plan || "",
        review_date: risk.review_date || "",
        identified_date: risk.identified_date || new Date().toISOString().split('T')[0]
      });
    }
  }, [risk]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Risk.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['risks']);
      navigate(createPageUrl(`RiskDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Risk.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['risks']);
      queryClient.invalidateQueries(['risk', riskId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const riskScore = getRiskLevel(formData.likelihood, formData.impact);
    const dataToSave = { ...formData, inherent_risk_score: riskScore };
    
    if (isNew || !riskId) {
      createMutation.mutate(dataToSave);
    } else {
      updateMutation.mutate({ id: riskId, data: dataToSave });
    }
  };

  const getRiskLevel = (likelihood, impact) => {
    const values = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    return (values[likelihood] || 3) * (values[impact] || 3);
  };

  const addControl = (controlId) => {
    if (!formData.control_ids.includes(controlId)) {
      const newControlIds = [...formData.control_ids, controlId];
      setFormData({ ...formData, control_ids: newControlIds });
      if (riskId) {
        updateMutation.mutate({ id: riskId, data: { control_ids: newControlIds } });
      }
    }
    setIsControlDialogOpen(false);
  };

  const removeControl = (controlId) => {
    const newControlIds = formData.control_ids.filter(id => id !== controlId);
    setFormData({ ...formData, control_ids: newControlIds });
    if (riskId) {
      updateMutation.mutate({ id: riskId, data: { control_ids: newControlIds } });
    }
  };

  const addFramework = (frameworkId) => {
    if (!formData.framework_ids.includes(frameworkId)) {
      const newFrameworkIds = [...formData.framework_ids, frameworkId];
      setFormData({ ...formData, framework_ids: newFrameworkIds });
      if (riskId) {
        updateMutation.mutate({ id: riskId, data: { framework_ids: newFrameworkIds } });
      }
    }
    setIsFrameworkDialogOpen(false);
  };

  const removeFramework = (frameworkId) => {
    const newFrameworkIds = formData.framework_ids.filter(id => id !== frameworkId);
    setFormData({ ...formData, framework_ids: newFrameworkIds });
    if (riskId) {
      updateMutation.mutate({ id: riskId, data: { framework_ids: newFrameworkIds } });
    }
  };

  const linkedControls = controls.filter(c => formData.control_ids?.includes(c.id));
  const linkedFrameworks = frameworks.filter(f => formData.framework_ids?.includes(f.id));
  const riskScore = getRiskLevel(formData.likelihood, formData.impact);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("RiskRegister")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'Add New Risk' : risk?.title || 'Risk Details'}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("RiskRegister")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            {isNew ? 'Create Risk' : 'Update Risk'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Risk Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Risk Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_id">Company *</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="cyber_security">Cyber Security</SelectItem>
                    <SelectItem value="third_party">Third Party</SelectItem>
                    <SelectItem value="reputational">Reputational</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="likelihood">Likelihood</Label>
                <Select value={formData.likelihood} onValueChange={(value) => setFormData({...formData, likelihood: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_low">Very Low (1)</SelectItem>
                    <SelectItem value="low">Low (2)</SelectItem>
                    <SelectItem value="medium">Medium (3)</SelectItem>
                    <SelectItem value="high">High (4)</SelectItem>
                    <SelectItem value="very_high">Very High (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Select value={formData.impact} onValueChange={(value) => setFormData({...formData, impact: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_low">Very Low (1)</SelectItem>
                    <SelectItem value="low">Low (2)</SelectItem>
                    <SelectItem value="medium">Medium (3)</SelectItem>
                    <SelectItem value="high">High (4)</SelectItem>
                    <SelectItem value="very_high">Very High (5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Score</Label>
                <div className="text-2xl font-bold text-slate-900">{riskScore}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="assessed">Assessed</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Risk Owner</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identified_date">Identified Date</Label>
                <Input
                  id="identified_date"
                  type="date"
                  value={formData.identified_date}
                  onChange={(e) => setFormData({...formData, identified_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({...formData, review_date: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mitigation_plan">Mitigation Plan</Label>
              <Textarea
                id="mitigation_plan"
                value={formData.mitigation_plan}
                onChange={(e) => setFormData({...formData, mitigation_plan: e.target.value})}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Linked Controls
                </CardTitle>
                <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Control</DialogTitle>
                    </DialogHeader>
                    <div className="mb-4">
                      <Link to={createPageUrl("ControlDetail?new=true")} target="_blank">
                        <Button type="button" variant="outline" size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Control
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {controls.map(control => (
                        <div
                          key={control.id}
                          className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => addControl(control.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{control.control_id}</p>
                              <p className="text-sm text-slate-600">{control.title}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {linkedControls.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No controls linked</p>
              ) : (
                <div className="space-y-2">
                  {linkedControls.map(control => (
                    <div key={control.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <div>
                        <p className="text-sm font-medium">{control.control_id}</p>
                        <p className="text-xs text-slate-600">{control.title}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeControl(control.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Linked Frameworks
                </CardTitle>
                <Dialog open={isFrameworkDialogOpen} onOpenChange={setIsFrameworkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Framework</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {frameworks.map(framework => (
                        <div
                          key={framework.id}
                          className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                          onClick={() => addFramework(framework.id)}
                        >
                          <p className="font-medium text-sm">{framework.name}</p>
                          {framework.description && (
                            <p className="text-xs text-slate-600">{framework.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {linkedFrameworks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No frameworks linked</p>
              ) : (
                <div className="space-y-2">
                  {linkedFrameworks.map(framework => (
                    <div key={framework.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <p className="text-sm font-medium">{framework.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFramework(framework.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </form>
    </div>
  );
}