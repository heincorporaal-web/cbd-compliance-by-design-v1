import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ControlDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const controlId = urlParams.get('id');
  const isNew = urlParams.get('new') === 'true';

  const [formData, setFormData] = useState({
    framework_id: "",
    control_id: "",
    title: "",
    description: "",
    category: "",
    priority: "medium"
  });

  const { data: existingControl } = useQuery({
    queryKey: ['control', controlId],
    queryFn: () => base44.entities.Control.filter({ id: controlId }),
    enabled: !!controlId && !isNew,
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: controlAssessments = [] } = useQuery({
    queryKey: ['controlAssessments', controlId],
    queryFn: () => base44.entities.ControlAssessment.filter({ control_id: controlId }),
    enabled: !!controlId && !isNew,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list(),
  });

  useEffect(() => {
    if (existingControl?.[0]) {
      setFormData(existingControl[0]);
    }
  }, [existingControl]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['controls']);
      navigate(createPageUrl(`ControlDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Control.update(controlId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['controls']);
      queryClient.invalidateQueries(['control', controlId]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew || !controlId) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-700',
      partial: 'bg-yellow-100 text-yellow-700',
      non_compliant: 'bg-red-100 text-red-700',
      not_applicable: 'bg-slate-100 text-slate-700',
      not_assessed: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const framework = frameworks.find(f => f.id === formData.framework_id);

  const complianceRate = controlAssessments.length > 0
    ? Math.round((controlAssessments.filter(ca => ca.status === 'compliant').length / controlAssessments.length) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Controls")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isNew ? 'New Control' : formData.title || 'Control Details'}
          </h1>
          <p className="text-slate-600">
            {framework ? `${framework.name} • ` : ''}Control Management
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {!isNew && controlId && (
              <TabsTrigger value="assessments">
                Assessments
                {controlAssessments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {controlAssessments.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Control Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="framework_id">Framework *</Label>
                    <Select value={formData.framework_id} onValueChange={(value) => setFormData({...formData, framework_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="control_id">Control ID *</Label>
                    <Input
                      id="control_id"
                      value={formData.control_id}
                      onChange={(e) => setFormData({...formData, control_id: e.target.value})}
                      placeholder="e.g., A.5.1"
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Control Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g., Access Control, Cryptography"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isNew && controlAssessments.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Compliance Overview</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">{complianceRate}%</div>
                      <p className="text-sm text-slate-600 mt-1">Compliance Rate</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">{controlAssessments.length}</div>
                      <p className="text-sm text-slate-600 mt-1">Total Assessments</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-900">
                        {controlAssessments.filter(ca => ca.status === 'non_compliant').length}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Non-Compliant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isNew && controlId && (
            <TabsContent value="assessments" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Assessment History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {controlAssessments.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {controlAssessments.map((ca) => {
                        const assessment = assessments.find(a => a.id === ca.assessment_id);
                        return (
                          <div key={ca.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">
                                  {assessment?.name || 'Assessment'}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={getStatusColor(ca.status)}>
                                    {ca.status?.replace('_', ' ')}
                                  </Badge>
                                  {ca.risk_level && ca.risk_level !== 'none' && (
                                    <Badge variant="outline" className={getPriorityColor(ca.risk_level)}>
                                      {ca.risk_level} risk
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {ca.notes && (
                              <p className="text-sm text-slate-600 mt-2">{ca.notes}</p>
                            )}
                            {ca.remediation_plan && (
                              <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm font-medium text-amber-900">Remediation Plan:</p>
                                <p className="text-sm text-amber-700 mt-1">{ca.remediation_plan}</p>
                                {ca.remediation_date && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    Target: {new Date(ca.remediation_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500">
                      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p>No assessments for this control yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Link to={createPageUrl("Controls")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {isNew || !controlId ? 'Create Control' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}