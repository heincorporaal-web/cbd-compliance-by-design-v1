import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, User, Clock, Database, Activity } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500),
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-slate-100 text-slate-700',
      export: 'bg-amber-100 text-amber-700'
    };
    return colors[action] || 'bg-slate-100 text-slate-700';
  };

  const getActionIcon = (action) => {
    const icons = {
      create: '+',
      update: '✎',
      delete: '×',
      login: '→',
      logout: '←',
      export: '↓'
    };
    return icons[action] || '•';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-600">Track all system activities and changes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Logs</p>
                <p className="text-3xl font-bold text-slate-900">{logs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Creates</p>
                <p className="text-3xl font-bold text-green-600">
                  {logs.filter(l => l.action === 'create').length}
                </p>
              </div>
              <div className="text-3xl text-green-600">+</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Updates</p>
                <p className="text-3xl font-bold text-blue-600">
                  {logs.filter(l => l.action === 'update').length}
                </p>
              </div>
              <div className="text-3xl text-blue-600">✎</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Deletions</p>
                <p className="text-3xl font-bold text-red-600">
                  {logs.filter(l => l.action === 'delete').length}
                </p>
              </div>
              <div className="text-3xl text-red-600">×</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by user, entity, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionColor(log.action)}>
                          {getActionIcon(log.action)} {log.action}
                        </Badge>
                        <Badge variant="outline">
                          <Database className="w-3 h-3 mr-1" />
                          {log.entity_type}
                        </Badge>
                        {log.entity_name && (
                          <span className="text-sm text-slate-600">{log.entity_name}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_name || log.user_email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.created_date && format(new Date(log.created_date), 'MMM dd, yyyy HH:mm:ss')}
                        </div>
                        {log.ip_address && (
                          <span className="text-xs">IP: {log.ip_address}</span>
                        )}
                      </div>

                      {log.changes && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                            View changes
                          </summary>
                          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              {log.changes.before && (
                                <div>
                                  <p className="font-medium text-slate-700 mb-1">Before:</p>
                                  <pre className="text-slate-600 overflow-auto">
                                    {JSON.stringify(log.changes.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.changes.after && (
                                <div>
                                  <p className="font-medium text-slate-700 mb-1">After:</p>
                                  <pre className="text-slate-600 overflow-auto">
                                    {JSON.stringify(log.changes.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}