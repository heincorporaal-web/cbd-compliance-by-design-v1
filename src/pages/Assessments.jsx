import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AssessmentForm from "../components/assessments/AssessmentForm";
import AssessmentCard from "../components/assessments/AssessmentCard";

export default function Assessments() {
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => base44.entities.Assessment.list('-created_date'),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setShowForm(false);
      setEditingAssessment(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assessment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setShowForm(false);
      setEditingAssessment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assessment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingAssessment) {
      updateMutation.mutate({ id: editingAssessment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this assessment?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = 
      assessment.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.framework_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.assessor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Risk Assessments</h1>
          <p className="text-slate-500 mt-1">Evaluate companies against risk frameworks</p>
        </div>
        <Button
          onClick={() => {
            setEditingAssessment(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {showForm && (
        <AssessmentForm
          assessment={editingAssessment}
          companies={companies}
          frameworks={frameworks}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAssessment(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-lg border border-slate-200">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">
            {searchTerm || statusFilter !== 'all' ? 'No assessments found' : 'No assessments yet'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Assessment
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}