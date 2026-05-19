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
import { Server, Plus, Search, Edit2, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { getICTSystemErrors, ErrorIcon } from "@/utils/validationErrors.jsx";

export default function ICTSystems() {
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    system_type: "other",
    system_type_custom: "",
    criticality: "supporting",
    description: "",
    owner: "",
    vendor: "",
    hosting_type: "on_premise",
    recovery_time_objective: "",
    recovery_point_objective: "",
    data_classification: "internal",
    status: "active"
  });

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['ictSystems'],
    queryFn: () => base44.entities.ICTSystem.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ICTSystem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ictSystems']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ICTSystem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ictSystems']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ICTSystem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['ictSystems']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      company_id: "",
      system_type: "other",
      system_type_custom: "",
      criticality: "supporting",
      description: "",
      owner: "",
      vendor: "",
      hosting_type: "on_premise",
      recovery_time_objective: "",
      recovery_point_objective: "",
      data_classification: "internal",
      status: "active"
    });
    setEditingSystem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (system) => {
    setEditingSystem(system);
    setFormData(system);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this ICT system?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSystems = systems.filter(system => {
    const matchesSearch = system.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.system_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = globalCompany === "all" || system.company_id === globalCompany;
    return matchesSearch && matchesCompany;
  });

  const getCriticalityColor = (criticality) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      important: 'bg-orange-500 text-white',
      supporting: 'bg-blue-500 text-white'
    };
    return colors[criticality] || 'bg-slate-500 text-white';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      decommissioned: 'bg-slate-100 text-slate-700 border-slate-200',
      planned: 'bg-blue-100 text-blue-700 border-blue-200',
      under_review: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ICT Systems Inventory</h1>
          <p className="text-slate-600">Manage critical ICT infrastructure for DORA compliance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add ICT System
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSystem ? 'Edit ICT System' : 'Add New ICT System'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">System Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
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
                  <Label htmlFor="system_type">System Type</Label>
                  <Select value={formData.system_type} onValueChange={(value) => setFormData({...formData, system_type: value, system_type_custom: value !== 'custom' ? '' : formData.system_type_custom})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core_banking">Core Banking</SelectItem>
                      <SelectItem value="payment_processing">Payment Processing</SelectItem>
                      <SelectItem value="trading_platform">Trading Platform</SelectItem>
                      <SelectItem value="risk_management">Risk Management</SelectItem>
                      <SelectItem value="customer_relationship">Customer Relationship</SelectItem>
                      <SelectItem value="data_analytics">Data Analytics</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="custom">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.system_type === 'custom' && (
                    <Input
                      placeholder="Enter custom type name…"
                      value={formData.system_type_custom || ""}
                      onChange={(e) => setFormData({...formData, system_type_custom: e.target.value})}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="criticality">Criticality *</Label>
                  <Select value={formData.criticality} onValueChange={(value) => setFormData({...formData, criticality: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="supporting">Supporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">System Owner</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hosting_type">Hosting Type</Label>
                  <Select value={formData.hosting_type} onValueChange={(value) => setFormData({...formData, hosting_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_premise">On Premise</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="managed_service">Managed Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_classification">Data Classification</Label>
                  <Select value={formData.data_classification} onValueChange={(value) => setFormData({...formData, data_classification: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="highly_confidential">Highly Confidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recovery_time_objective">RTO</Label>
                  <Input
                    id="recovery_time_objective"
                    placeholder="e.g., 1 hour, 4 hours"
                    value={formData.recovery_time_objective}
                    onChange={(e) => setFormData({...formData, recovery_time_objective: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recovery_point_objective">RPO</Label>
                  <Input
                    id="recovery_point_objective"
                    placeholder="e.g., 15 minutes"
                    value={formData.recovery_point_objective}
                    onChange={(e) => setFormData({...formData, recovery_point_objective: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="decommissioned">Decommissioned</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingSystem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search ICT systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading systems...</div>
          ) : filteredSystems.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredSystems.map((system) => {
                const company = companies.find(c => c.id === system.company_id);
                return (
                  <div key={system.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <Server className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{system.name}</h3>
                            <ErrorIcon errors={getICTSystemErrors(system)} />
                            <Badge className={getCriticalityColor(system.criticality)}>
                              {system.criticality}
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(system.status)} border`}>
                              {system.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>{company?.name || 'Unknown Company'} • {system.system_type === 'custom' && system.system_type_custom ? system.system_type_custom : system.system_type?.replace(/_/g, ' ')}</p>
                            {system.vendor && <p>Vendor: {system.vendor}</p>}
                            {system.owner && <p>Owner: {system.owner}</p>}
                            {(system.recovery_time_objective || system.recovery_point_objective) && (
                              <p>
                                {system.recovery_time_objective && `RTO: ${system.recovery_time_objective}`}
                                {system.recovery_time_objective && system.recovery_point_objective && ' • '}
                                {system.recovery_point_objective && `RPO: ${system.recovery_point_objective}`}
                              </p>
                            )}
                          </div>
                          {system.description && (
                            <p className="text-sm text-slate-500 mt-2">{system.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`ICTSystemDetail?id=${system.id}`)}>
                          <Button variant="ghost" size="icon" title="View details">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(system)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(system.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Server className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No ICT systems found</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add Your First ICT System
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}