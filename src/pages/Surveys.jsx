import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/layout/PageHeader";

export default function Surveys() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => base44.entities.Survey.list('-created_date'),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['surveyResponses'],
    queryFn: () => base44.entities.SurveyResponse.list(),
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      active: 'bg-green-100 text-green-700 border-green-200',
      closed: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getEntityColor = (type) => {
    const colors = {
      ICTSystem: 'bg-blue-100 text-blue-700 border-blue-200',
      ThirdPartyProvider: 'bg-purple-100 text-purple-700 border-purple-200',
      Framework: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      ITCapability: 'bg-teal-100 text-teal-700 border-teal-200',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          navItemId="surveys"
          icon={ClipboardList}
          title="Surveys"
          tagline="Create and manage surveys for systems, suppliers, and frameworks"
          gradient="from-fuchsia-600 to-purple-700"
        />
        <Link to={createPageUrl("SurveyBuilder")}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Button>
        </Link>
      </div>

      {surveys.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search surveys by title, entity, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {surveys.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Surveys Yet</h3>
            <p className="text-slate-600 mb-6">
              Create surveys to gather information from stakeholders
            </p>
            <Link to={createPageUrl("SurveyBuilder")}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Survey
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {surveys.filter(s => 
            s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.linked_entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.linked_entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.status?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((survey) => {
            const responseCount = responses.filter(r => r.survey_id === survey.id).length;
            
            return (
              <Card key={survey.id} className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-2">{survey.title}</CardTitle>
                      {survey.description && (
                        <p className="text-sm text-slate-600">{survey.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(survey.status)} border`}>
                      {survey.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${getEntityColor(survey.linked_entity_type)} border`}>
                        {survey.linked_entity_type}
                      </Badge>
                      {survey.linked_entity_name && (
                        <span className="text-sm text-slate-600">{survey.linked_entity_name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{survey.questions?.length || 0} questions</span>
                      <span>{responseCount} responses</span>
                    </div>

                    {survey.due_date && (
                      <p className="text-sm text-slate-600">
                        Due: {format(new Date(survey.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={createPageUrl(`SurveyDetail?id=${survey.id}`)} className="flex-1">
                      <Button className="w-full" variant="outline">
                        View Survey
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    {survey.status === 'draft' && (
                      <Link to={createPageUrl(`SurveyBuilder?id=${survey.id}`)}>
                        <Button variant="outline">Edit</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}