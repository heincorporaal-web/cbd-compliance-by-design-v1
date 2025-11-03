import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import FrameworkForm from "../components/frameworks/FrameworkForm";
import FrameworkCard from "../components/frameworks/FrameworkCard";

export default function Frameworks() {
  const [showForm, setShowForm] = useState(false);
  const [editingFramework, setEditingFramework] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: frameworks = [], isLoading } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Framework.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      setShowForm(false);
      setEditingFramework(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Framework.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
      setShowForm(false);
      setEditingFramework(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Framework.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frameworks'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingFramework) {
      updateMutation.mutate({ id: editingFramework.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (framework) => {
    setEditingFramework(framework);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this framework?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredFrameworks = frameworks.filter(framework =>
    framework.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    framework.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Risk Frameworks</h1>
          <p className="text-slate-500 mt-1">Manage compliance and risk assessment frameworks</p>
        </div>
        <Button
          onClick={() => {
            setEditingFramework(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Framework
        </Button>
      </div>

      {showForm && (
        <FrameworkForm
          framework={editingFramework}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingFramework(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search frameworks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredFrameworks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-lg border border-slate-200">
          <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">
            {searchTerm ? 'No frameworks found matching your search' : 'No frameworks yet'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Framework
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFrameworks.map((framework) => (
            <FrameworkCard
              key={framework.id}
              framework={framework}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}