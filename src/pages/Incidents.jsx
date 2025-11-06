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
import { AlertTriangle, Plus, Search, Edit2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export default function Incidents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    company_id: "",
    ict_system_id: "",
    incident_type: "operational_disruption",
    severity: "moderate",
    status: "open",
    detected_date: new Date().toISOString(),
    description: "",
    impact: "",
    root_cause: "",
    remediation_actions: "",
    lessons_learned: "",
    reported_to_regulator: false,
    regulator_reference: ""
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-detected_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: ictSystems = [] } = useQuery({
    queryKey: ['ictSystems'],
    queryFn: () => base44.entities.ICTSystem.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      company_id: "",
      ict_system_id: "",
      incident_type: "operational_disruption",
      severity: "moderate",
      status: "open",
      detected_date: new Date().toISOString(),
      description: "",
      impact: "",
      root_cause: "",
      remediation_actions: "",
      lessons_learned: "",
      reported_to_regulator: false,
      regulator_reference: ""
    });
    setEditingIncident(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIncident) {
      updateMutation.mutate({ id: editingIncident.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (incident) => {
    setEditingIncident(incident);
    setFormData(incident);
    setIsDialogOpen(true);
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.incident_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      major: 'bg-orange-500 text-white',
      moderate: 'bg-yellow-500 text-white',
      minor: 'bg-blue-500 text-white'
    };
    return colors[severity] || 'bg-slate-500 text-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-700 border-red-200',
      investigating: 'bg-amber-100 text-amber-700 border-amber-200',
      resolved: 'bg-green-100 text-green-700 border-green-200',
      closed: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Incident Management</h1>
          <p className="text-slate-600">Track and manage ICT-related incidents for DORA compliance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingIncident ? 'Update Incident' : 'Report New Incident'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Incident Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_id">Company *</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
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
                  <Label htmlFor="ict_system_id">Affected ICT System</Label>
                  <Select value={formData.ict_system_id} onValueChange={(value) => setFormData({...formData, ict_system_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      {ictSystems.map(system => (
                        <SelectItem key={system.id} value={system.id}>{system.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident_type">Incident Type *</Label>
                  <Select value={formData.incident_type} onValueChange={(value) => setFormData({...formData, incident_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cyber_attack">Cyber Attack</SelectItem>
                      <SelectItem value="system_outage">System Outage</SelectItem>
                      <SelectItem value="data_breach">Data Breach</SelectItem>
                      <SelectItem value="operational_disruption">Operational Disruption</SelectItem>
                      <SelectItem value="third_party_failure">Third Party Failure</SelectItem>
                      <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                      <SelectItem value="human_error">Human Error</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detected_date">Detected Date *</Label>
                  <Input
                    id="detected_date"
                    type="datetime-local"
                    value={formData.detected_date?.slice(0, 16)}
                    onChange={(e) => setFormData({...formData, detected_date: e.target.value})}
                    required
                  />
                </div>
                {formData.status === 'resolved' || formData.status === 'closed' ? (
                  <div className="space-y-2">
                    <Label htmlFor="resolved_date">Resolved Date</Label>
                    <Input
                      id="resolved_date"
                      type="datetime-local"
                      value={formData.resolved_date?.slice(0, 16)}
                      onChange={(e) => setFormData({...formData, resolved_date: e.target.value})}
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impact">Business Impact</Label>
                <Textarea
                  id="impact"
                  value={formData.impact}
                  onChange={(e) => setFormData({...formData, impact: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="root_cause">Root Cause</Label>
                <Textarea
                  id="root_cause"
                  value={formData.root_cause}
                  onChange={(e) => setFormData({...formData, root_cause: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remediation_actions">Remediation Actions</Label>
                <Textarea
                  id="remediation_actions"
                  value={formData.remediation_actions}
                  onChange={(e) => setFormData({...formData, remediation_actions: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessons_learned">Lessons Learned</Label>
                <Textarea
                  id="lessons_learned"
                  value={formData.lessons_learned}
                  onChange={(e) => setFormData({...formData, lessons_learned: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reported_to_regulator"
                  checked={formData.reported_to_regulator}
                  onCheckedChange={(checked) => setFormData({...formData, reported_to_regulator: checked})}
                />
                <Label htmlFor="reported_to_regulator">Reported to Regulator</Label>
              </div>
              {formData.reported_to_regulator && (
                <div className="space-y-2">
                  <Label htmlFor="regulator_reference">Regulator Reference</Label>
                  <Input
                    id="regulator_reference"
                    value={formData.regulator_reference}
                    onChange={(e) => setFormData({...formData, regulator_reference: e.target.value})}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingIncident ? 'Update' : 'Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading incidents...</div>
          ) : filteredIncidents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredIncidents.map((incident) => {
                const company = companies.find(c => c.id === incident.company_id);
                const system = ictSystems.find(s => s.id === incident.ict_system_id);
                return (
                  <div key={incident.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge variant="outline" className={`${getStatusColor(incident.status)} border`}>
                            {incident.status}
                          </Badge>
                          {incident.reported_to_regulator && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                              Reported
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p>{company?.name || 'Unknown Company'} • {incident.incident_type.replace(/_/g, ' ')}</p>
                          {system && <p>System: {system.name}</p>}
                          <p>Detected: {format(new Date(incident.detected_date), 'MMM d, yyyy HH:mm')}</p>
                          {incident.resolved_date && (
                            <p className="text-green-600">
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              Resolved: {format(new Date(incident.resolved_date), 'MMM d, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                        {incident.description && (
                          <p className="text-sm text-slate-600 mt-2">{incident.description}</p>
                        )}
                        {incident.impact && (
                          <p className="text-sm text-slate-600 mt-2">
                            <span className="font-medium">Impact:</span> {incident.impact}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(incident)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No incidents found</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Report Your First Incident
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}