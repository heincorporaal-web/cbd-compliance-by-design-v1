import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Controls() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFramework, setFilterFramework] = useState("all");

  const { data: controls = [] } = useQuery({
    queryKey: ['controls'],
    queryFn: () => base44.entities.Control.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const filteredControls = controls.filter(control => {
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Controls</h1>
          <p className="text-slate-600">Browse and manage security controls across frameworks</p>
        </div>
      </div>

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
                  <SelectItem key={framework.id} value={framework.id}>{framework.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredControls.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredControls.map((control) => {
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
                            <p className="text-sm text-slate-600 mb-2">{control.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            {framework && <span>{framework.name}</span>}
                            {control.category && <span>• {control.category}</span>}
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
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No controls found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}