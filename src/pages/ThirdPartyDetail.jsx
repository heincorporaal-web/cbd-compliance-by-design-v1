import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Calendar, Shield, FileText, AlertCircle, CheckCircle2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function ThirdPartyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  const [assessmentFormData, setAssessmentFormData] = useState({
    provider_id: providerId,
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: "annual_review",
    assessor: "",
    overall_rating: "satisfactory",
    risk_rating: "medium",
    findings: "",
    recommendations: "",
    action_items: "",
    compliance_status: "compliant",
    next_assessment_date: "",
    documents_reviewed: "",
    status: "completed"
  });

  const { data: provider } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => base44.entities.ThirdPartyProvider.filter({ id: providerId }).then(res => res[0]),
    enabled: !!providerId,
  });

  const { data: company } = useQuery({
    queryKey: ['company', provider?.company_id],
    queryFn: () => base44.entities.Company.filter({ id: provider.company_id }).then(res => res[0]),
    enabled: !!provider?.company_id,
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['thirdPartyAssessments', providerId],
    queryFn: () => base44.entities.ThirdPartyAssessment.filter({ provider_id: providerId }),
    enabled: !!providerId,
  });

  const createAssessmentMutation = useMutation({
    mutationFn: (data) => base44.entities.ThirdPartyAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['thirdPartyAssessments', providerId]);
      setIsAssessmentDialogOpen(false);
      resetAssessmentForm();
    },
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ThirdPartyAssessment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['thirdPartyAssessments', providerId]);
      setIsAssessmentDialogOpen(false);
      resetAssessmentForm();
    },
  });

  const resetAssessmentForm = () => {
    setAssessmentFormData({
      provider_id: providerId,
      assessment_date: new Date().toISOString().split('T')[0],
      assessment_type: "annual_review",
      assessor: "",
      overall_rating: "satisfactory",
      risk_rating: "medium",
      findings: "",
      recommendations: "",
      action_items: "",
      compliance_status: "compliant",
      next_assessment_date: "",
      documents_reviewed: "",
      status: "completed"
    });
    setEditingAssessment(null);
  };

  const handleAssessmentSubmit = (e) => {
    e.preventDefault();
    if (editingAssessment) {
      updateAssessmentMutation.mutate({ id: editingAssessment.id, data: assessmentFormData });
    } else {
      createAssessmentMutation.mutate(assessmentFormData);
    }
  };

  const handleEditAssessment = (assessment) => {
    setEditingAssessment(assessment);
    setAssessmentFormData(assessment);
    setIsAssessmentDialogOpen(true);
  };

  const getCriticalityColor = (criticality) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      important: 'bg-orange-500 text-white',
      supporting: 'bg-blue-500 text-white'
    };
    return colors[criticality] || 'bg-slate-500 text-white';
  };

  const getRiskColor = (risk) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[risk] || 'bg-slate-100 text-slate-700';
  };

  const getRatingColor = (rating) => {
    const colors = {
      satisfactory: 'bg-green-100 text-green-700 border-green-200',
      acceptable: 'bg-blue-100 text-blue-700 border-blue-200',
      needs_improvement: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      unsatisfactory: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[rating] || 'bg-slate-100 text-slate-700';
  };

  const getComplianceColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-700 border-green-200',
      partially_compliant: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      non_compliant: 'bg-red-100 text-red-700 border-red-200',
      not_applicable: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (!provider) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const sortedAssessments = [...assessments].sort((a, b) => 
    new Date(b.assessment_date) - new Date(a.assessment_date)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("ThirdParties")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">{provider.name}</h1>
            <Badge className={getCriticalityColor(provider.criticality)}>
              {provider.criticality}
            </Badge>
            <Badge variant="outline" className={`${getRiskColor(provider.risk_rating)} border`}>
              {provider.risk_rating} risk
            </Badge>
          </div>
          {company && (
            <p className="text-slate-600">{company.name} • {provider.service_type.replace(/_/g, ' ')}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">
            Assessment History
            {assessments.length > 0 && (
              <Badge variant="secondary" className="ml-2">{assessments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Provider Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {provider.contact_name && (
                      <div>
                        <p className="text-xs text-slate-500">Contact Name</p>
                        <p className="text-sm text-slate-900">{provider.contact_name}</p>
                      </div>
                    )}
                    {provider.contact_email && (
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm text-slate-900">{provider.contact_email}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Contract Information</h4>
                  <div className="space-y-2">
                    {provider.contract_start_date && (
                      <div>
                        <p className="text-xs text-slate-500">Contract Start</p>
                        <p className="text-sm text-slate-900">{format(new Date(provider.contract_start_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                    {provider.contract_end_date && (
                      <div>
                        <p className="text-xs text-slate-500">Contract End</p>
                        <p className="text-sm text-slate-900">{format(new Date(provider.contract_end_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Audit Information</h4>
                  <div className="space-y-2">
                    {provider.last_audit_date && (
                      <div>
                        <p className="text-xs text-slate-500">Last Audit</p>
                        <p className="text-sm text-slate-900">{format(new Date(provider.last_audit_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                    {provider.next_audit_date && (
                      <div>
                        <p className="text-xs text-slate-500">Next Audit</p>
                        <p className="text-sm text-slate-900">{format(new Date(provider.next_audit_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Status</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Service Type</p>
                      <p className="text-sm text-slate-900">{provider.service_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <Badge variant="outline">{provider.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {provider.notes && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600">{provider.notes}</p>
                </div>
              )}

              {provider.certifications && provider.certifications.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {provider.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Assessment History</h2>
              <p className="text-sm text-slate-600">Track audits and assessments conducted on this provider</p>
            </div>
            <Dialog open={isAssessmentDialogOpen} onOpenChange={(open) => {
              setIsAssessmentDialogOpen(open);
              if (!open) resetAssessmentForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Assessment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAssessment ? 'Update Assessment' : 'Record New Assessment'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assessment_date">Assessment Date *</Label>
                      <Input
                        id="assessment_date"
                        type="date"
                        value={assessmentFormData.assessment_date}
                        onChange={(e) => setAssessmentFormData({...assessmentFormData, assessment_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assessment_type">Assessment Type *</Label>
                      <Select value={assessmentFormData.assessment_type} onValueChange={(value) => setAssessmentFormData({...assessmentFormData, assessment_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="initial_assessment">Initial Assessment</SelectItem>
                          <SelectItem value="annual_review">Annual Review</SelectItem>
                          <SelectItem value="security_audit">Security Audit</SelectItem>
                          <SelectItem value="compliance_audit">Compliance Audit</SelectItem>
                          <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                          <SelectItem value="due_diligence">Due Diligence</SelectItem>
                          <SelectItem value="contract_renewal">Contract Renewal</SelectItem>
                          <SelectItem value="incident_review">Incident Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assessor">Assessor</Label>
                      <Input
                        id="assessor"
                        value={assessmentFormData.assessor}
                        onChange={(e) => setAssessmentFormData({...assessmentFormData, assessor: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={assessmentFormData.status} onValueChange={(value) => setAssessmentFormData({...assessmentFormData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overall_rating">Overall Rating</Label>
                      <Select value={assessmentFormData.overall_rating} onValueChange={(value) => setAssessmentFormData({...assessmentFormData, overall_rating: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="satisfactory">Satisfactory</SelectItem>
                          <SelectItem value="acceptable">Acceptable</SelectItem>
                          <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                          <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="risk_rating">Risk Rating</Label>
                      <Select value={assessmentFormData.risk_rating} onValueChange={(value) => setAssessmentFormData({...assessmentFormData, risk_rating: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compliance_status">Compliance Status</Label>
                      <Select value={assessmentFormData.compliance_status} onValueChange={(value) => setAssessmentFormData({...assessmentFormData, compliance_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                          <SelectItem value="not_applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_assessment_date">Next Assessment Date</Label>
                      <Input
                        id="next_assessment_date"
                        type="date"
                        value={assessmentFormData.next_assessment_date}
                        onChange={(e) => setAssessmentFormData({...assessmentFormData, next_assessment_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="findings">Findings</Label>
                    <Textarea
                      id="findings"
                      value={assessmentFormData.findings}
                      onChange={(e) => setAssessmentFormData({...assessmentFormData, findings: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recommendations">Recommendations</Label>
                    <Textarea
                      id="recommendations"
                      value={assessmentFormData.recommendations}
                      onChange={(e) => setAssessmentFormData({...assessmentFormData, recommendations: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action_items">Action Items</Label>
                    <Textarea
                      id="action_items"
                      value={assessmentFormData.action_items}
                      onChange={(e) => setAssessmentFormData({...assessmentFormData, action_items: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documents_reviewed">Documents Reviewed</Label>
                    <Textarea
                      id="documents_reviewed"
                      value={assessmentFormData.documents_reviewed}
                      onChange={(e) => setAssessmentFormData({...assessmentFormData, documents_reviewed: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAssessmentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingAssessment ? 'Update' : 'Record'} Assessment
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {sortedAssessments.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Assessment History</h3>
                <p className="text-slate-600 mb-6">
                  No assessments have been recorded for this provider yet
                </p>
                <Button onClick={() => setIsAssessmentDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record First Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedAssessments.map((assessment) => (
                <Card key={assessment.id} className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {assessment.assessment_type.replace(/_/g, ' ')}
                          </CardTitle>
                          <Badge variant="outline" className={`${getRatingColor(assessment.overall_rating)} border`}>
                            {assessment.overall_rating.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className={`${getRiskColor(assessment.risk_rating)} border`}>
                            {assessment.risk_rating} risk
                          </Badge>
                          <Badge variant="outline" className={`${getComplianceColor(assessment.compliance_status)} border`}>
                            {assessment.compliance_status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                          </div>
                          {assessment.assessor && (
                            <span>Assessor: {assessment.assessor}</span>
                          )}
                          {assessment.status && (
                            <Badge variant="secondary">{assessment.status.replace('_', ' ')}</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEditAssessment(assessment)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {assessment.findings && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Findings
                          </h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {assessment.findings}
                          </p>
                        </div>
                      )}
                      {assessment.recommendations && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Recommendations
                          </h4>
                          <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            {assessment.recommendations}
                          </p>
                        </div>
                      )}
                      {assessment.action_items && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Action Items
                          </h4>
                          <p className="text-sm text-slate-600 bg-green-50 p-3 rounded-lg border border-green-200">
                            {assessment.action_items}
                          </p>
                        </div>
                      )}
                      {assessment.documents_reviewed && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Documents Reviewed</h4>
                          <p className="text-sm text-slate-600">{assessment.documents_reviewed}</p>
                        </div>
                      )}
                      {assessment.next_assessment_date && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Next Assessment Scheduled:</span>{' '}
                            {format(new Date(assessment.next_assessment_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}