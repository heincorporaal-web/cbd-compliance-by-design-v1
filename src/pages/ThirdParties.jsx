import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Search, Edit2, Trash2, Calendar, Shield, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";

export default function ThirdParties() {
  const [globalCompany] = useCompanyFilter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    service_type: "other",
    criticality: "supporting",
    contract_start_date: "",
    contract_end_date: "",
    contact_name: "",
    contact_email: "",
    last_audit_date: "",
    next_audit_date: "",
    risk_rating: "medium",
    status: "active",
    notes: "",
    certifications: []
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['thirdParties'],
    queryFn: () => base44.entities.ThirdPartyProvider.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ThirdPartyProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['thirdParties']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ThirdPartyProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['thirdParties']);
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ThirdPartyProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['thirdParties']);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      company_id: "",
      service_type: "other",
      criticality: "supporting",
      contract_start_date: "",
      contract_end_date: "",
      contact_name: "",
      contact_email: "",
      last_audit_date: "",
      next_audit_date: "",
      risk_rating: "medium",
      status: "active",
      notes: "",
      certifications: []
    });
    setEditingProvider(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setFormData(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this third party provider?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = globalCompany === "all" || provider.company_id === globalCompany;
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

  const getRiskColor = (risk) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[risk] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      under_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      terminated: 'bg-red-100 text-red-700 border-red-200',
      onboarding: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Third Party Providers</h1>
          <p className="text-slate-600">Manage third-party risk and vendor relationships</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name *</Label>
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
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select value={formData.service_type} onValueChange={(value) => setFormData({...formData, service_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud_hosting">Cloud Hosting</SelectItem>
                      <SelectItem value="software_as_service">Software as Service</SelectItem>
                      <SelectItem value="managed_security">Managed Security</SelectItem>
                      <SelectItem value="data_center">Data Center</SelectItem>
                      <SelectItem value="payment_processing">Payment Processing</SelectItem>
                      <SelectItem value="it_support">IT Support</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="risk_rating">Risk Rating</Label>
                  <Select value={formData.risk_rating} onValueChange={(value) => setFormData({...formData, risk_rating: value})}>
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_start_date">Contract Start</Label>
                  <Input
                    id="contract_start_date"
                    type="date"
                    value={formData.contract_start_date}
                    onChange={(e) => setFormData({...formData, contract_start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_end_date">Contract End</Label>
                  <Input
                    id="contract_end_date"
                    type="date"
                    value={formData.contract_end_date}
                    onChange={(e) => setFormData({...formData, contract_end_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_audit_date">Last Audit</Label>
                  <Input
                    id="last_audit_date"
                    type="date"
                    value={formData.last_audit_date}
                    onChange={(e) => setFormData({...formData, last_audit_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_audit_date">Next Audit</Label>
                  <Input
                    id="next_audit_date"
                    type="date"
                    value={formData.next_audit_date}
                    onChange={(e) => setFormData({...formData, next_audit_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingProvider ? 'Update' : 'Create'}
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
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading providers...</div>
          ) : filteredProviders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredProviders.map((provider) => {
                const company = companies.find(c => c.id === provider.company_id);
                return (
                  <div key={provider.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{provider.name}</h3>
                            <Badge className={getCriticalityColor(provider.criticality)}>
                              {provider.criticality}
                            </Badge>
                            <Badge variant="outline" className={`${getRiskColor(provider.risk_rating)} border`}>
                              {provider.risk_rating} risk
                            </Badge>
                            <Badge variant="outline" className={`${getStatusColor(provider.status)} border`}>
                              {provider.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>{company?.name || 'Unknown Company'} • {provider.service_type.replace(/_/g, ' ')}</p>
                            {provider.contact_name && (
                              <p>Contact: {provider.contact_name}{provider.contact_email && ` (${provider.contact_email})`}</p>
                            )}
                            {provider.contract_end_date && (
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Contract ends: {format(new Date(provider.contract_end_date), 'MMM d, yyyy')}
                              </p>
                            )}
                            {provider.next_audit_date && (
                              <p className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Next audit: {format(new Date(provider.next_audit_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          {provider.notes && (
                            <p className="text-sm text-slate-500 mt-2">{provider.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`ThirdPartyDetail?id=${provider.id}`)}>
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(provider)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(provider.id)}>
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
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No third party providers found</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add Your First Provider
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}