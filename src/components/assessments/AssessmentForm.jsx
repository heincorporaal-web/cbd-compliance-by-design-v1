import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Shield } from "lucide-react";
import CompanyField from "@/components/CompanyField";

export default function AssessmentForm({ assessment, companies, frameworks, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState(assessment || {
    company_id: '',
    company_name: '',
    framework_id: '',
    framework_name: '',
    assessment_date: new Date().toISOString().split('T')[0],
    assessor: '',
    status: 'draft',
    overall_score: 0,
    risk_level: 'medium',
    findings: [],
    notes: '',
    next_review_date: ''
  });

  const handleCompanyChange = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    setFormData({
      ...formData,
      company_id: companyId,
      company_name: company?.name || ''
    });
  };

  const handleFrameworkChange = (frameworkId) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    setFormData({
      ...formData,
      framework_id: frameworkId,
      framework_name: framework?.name || ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            {assessment ? 'Edit Assessment' : 'New Risk Assessment'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <CompanyField value={formData.company_id} onChange={handleCompanyChange} companies={companies} />
            <div className="space-y-2">
              <Label htmlFor="framework_id">Framework *</Label>
              <Select
                value={formData.framework_id}
                onValueChange={handleFrameworkChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.filter(f => f.is_active).map(framework => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assessment_date">Assessment Date *</Label>
              <Input
                id="assessment_date"
                type="date"
                value={formData.assessment_date}
                onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessor">Assessor</Label>
              <Input
                id="assessor"
                value={formData.assessor}
                onChange={(e) => setFormData({ ...formData, assessor: e.target.value })}
                placeholder="Person conducting assessment"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overall_score">Overall Score (0-100)</Label>
              <Input
                id="overall_score"
                type="number"
                min="0"
                max="100"
                value={formData.overall_score}
                onChange={(e) => setFormData({ ...formData, overall_score: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk_level">Risk Level</Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value) => setFormData({ ...formData, risk_level: value })}
              >
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_review_date">Next Review Date</Label>
            <Input
              id="next_review_date"
              type="date"
              value={formData.next_review_date}
              onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Assessment notes, findings, and recommendations..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : assessment ? 'Update Assessment' : 'Create Assessment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}