import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, ArrowRight, Plus, Download, Upload, Library, Building, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Controls() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFramework, setFilterFramework] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("library");

  const { data: allControls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const libraryControls = allControls.filter(c => c.is_library_control === true);
  const companyControls = allControls.filter(c => c.is_library_control !== true);

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const importControlLibrary = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.functions.invoke('importControlLibrary', { file_url });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Successfully imported ${data.imported} controls from library`);
        queryClient.invalidateQueries(['controls']);
        setIsImportDialogOpen(false);
      } else {
        toast.error('Import failed');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Import failed');
    },
  });

  const filteredLibraryControls = libraryControls.filter(control => {
    const matchesSearch = control.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.control_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFramework = filterFramework === "all" || control.framework_id === filterFramework;
    return matchesSearch && matchesFramework;
  });

  const filteredCompanyControls = companyControls.filter(control => {
    const matchesSearch = control.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.control_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         control.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFramework = filterFramework === "all" || control.framework_id === filterFramework;
    return matchesSearch && matchesFramework;
  });

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority] || 'bg-slate-500 text-white';
  };

  const getCriticalityColor = (criticality) => {
    const colors = {
      'Must Have': 'bg-red-100 text-red-800 border-red-300',
      'Should Have': 'bg-amber-100 text-amber-800 border-amber-300',
      'Nice to Have': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[criticality] || 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Controls</h1>
          <p className="text-slate-600">Browse and manage security controls across frameworks</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "company" && (
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Controls
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Company Controls</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Upload an Excel file containing controls to import into the company controls register.
                  </p>
                  <FileUpload
                    accept=".xlsx,.xls"
                    onUpload={(file) => importControlLibrary.mutate(file)}
                    disabled={importing}
                  />
                  {importing && (
                    <p className="text-sm text-slate-500">Importing controls...</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Link to={createPageUrl("ControlDetail?new=true")}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Control
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="library" className="gap-2">
            <Library className="w-4 h-4" />
            Master Library ({libraryControls.length})
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building className="w-4 h-4" />
            Company Controls ({companyControls.length})
          </TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search controls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterFramework} onValueChange={setFilterFramework}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frameworks</SelectItem>
                  {frameworks.map(framework => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.framework_code || framework.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="library" className="m-0">
              {filteredLibraryControls.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredLibraryControls.map((control) => {
                    const framework = frameworks.find(f => f.id === control.framework_id);
                    return (
                      <div key={control.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{control.control_id}</h3>
                                <Badge className={getPriorityColor(control.priority)}>
                                  {control.priority}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-slate-700 mb-1">{control.title}</p>
                              {control.description && (
                                <div className="flex items-start gap-1.5 mb-2">
                                  <p className="text-sm text-slate-600 line-clamp-2 flex-1">{control.description}</p>
                                  {control.description.length > 120 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                          {control.description}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                {framework && <span>{framework.framework_code || framework.name}</span>}
                                {control.category && <span>• {control.category}</span>}
                                {control.control_criticality && (
                                  <Badge variant="outline" className={`text-xs border-2 ${getCriticalityColor(control.control_criticality)}`}>
                                    {control.control_criticality}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link to={createPageUrl(`ControlDetail?id=${control.id}`)}>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No library controls found. Import from Excel to populate the master library.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="company" className="m-0">
              {filteredCompanyControls.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredCompanyControls.map((control) => {
                    const framework = frameworks.find(f => f.id === control.framework_id);
                    return (
                      <div key={control.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{control.control_id}</h3>
                                <Badge className={getPriorityColor(control.priority)}>
                                  {control.priority}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-slate-700 mb-1">{control.title}</p>
                              {control.description && (
                                <div className="flex items-start gap-1.5 mb-2">
                                  <p className="text-sm text-slate-600 line-clamp-2 flex-1">{control.description}</p>
                                  {control.description.length > 120 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs text-xs">
                                          {control.description}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                {framework && <span>{framework.framework_code || framework.name}</span>}
                                {control.category && <span>• {control.category}</span>}
                                {control.control_criticality && (
                                  <Badge variant="outline" className={`text-xs border-2 ${getCriticalityColor(control.control_criticality)}`}>
                                    {control.control_criticality}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link to={createPageUrl(`ControlDetail?id=${control.id}`)}>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No company controls found</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}