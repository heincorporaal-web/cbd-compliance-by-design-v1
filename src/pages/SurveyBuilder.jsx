import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import AIQuestionGenerator from "../components/surveys/AIQuestionGenerator";

export default function SurveyBuilder() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: existingSurvey } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => base44.entities.Survey.filter({ id: surveyId }).then(res => res[0]),
    enabled: !!surveyId,
  });

  const { data: ictSystems = [] } = useQuery({
    queryKey: ['ictSystems'],
    queryFn: () => base44.entities.ICTSystem.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.ThirdPartyProvider.list(),
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['frameworks'],
    queryFn: () => base44.entities.Framework.list(),
  });

  const { data: linkedEntity } = useQuery({
    queryKey: ['linkedEntity', formData.linked_entity_type, formData.linked_entity_id],
    queryFn: async () => {
      if (!formData.linked_entity_id) return null;
      const entities = getEntityOptions();
      return entities.find(e => e.id === formData.linked_entity_id);
    },
    enabled: !!formData.linked_entity_id,
  });

  const [formData, setFormData] = useState({
    title: existingSurvey?.title || "",
    description: existingSurvey?.description || "",
    linked_entity_type: existingSurvey?.linked_entity_type || "ICTSystem",
    linked_entity_id: existingSurvey?.linked_entity_id || "",
    linked_entity_name: existingSurvey?.linked_entity_name || "",
    due_date: existingSurvey?.due_date || "",
    status: existingSurvey?.status || "draft",
    questions: existingSurvey?.questions || []
  });

  React.useEffect(() => {
    if (existingSurvey) {
      setFormData({
        title: existingSurvey.title || "",
        description: existingSurvey.description || "",
        linked_entity_type: existingSurvey.linked_entity_type || "ICTSystem",
        linked_entity_id: existingSurvey.linked_entity_id || "",
        linked_entity_name: existingSurvey.linked_entity_name || "",
        due_date: existingSurvey.due_date || "",
        status: existingSurvey.status || "draft",
        questions: existingSurvey.questions || []
      });
    }
  }, [existingSurvey]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Survey.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['surveys']);
      navigate(createPageUrl(`SurveyDetail?id=${data.id}`));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Survey.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['surveys']);
      queryClient.invalidateQueries(['survey', surveyId]);
      navigate(createPageUrl(`SurveyDetail?id=${surveyId}`));
    },
  });

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          id: Date.now().toString(),
          question: "",
          type: "text",
          options: [],
          required: false
        }
      ]
    });
  };

  const handleAIGenerate = (generatedQuestions) => {
    setFormData({
      ...formData,
      questions: [...formData.questions, ...generatedQuestions]
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (surveyId) {
      updateMutation.mutate({ id: surveyId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getEntityOptions = () => {
    switch (formData.linked_entity_type) {
      case 'ICTSystem':
        return ictSystems;
      case 'ThirdPartyProvider':
        return suppliers;
      case 'Framework':
        return frameworks;
      default:
        return [];
    }
  };

  const handleEntityChange = (entityId) => {
    const entities = getEntityOptions();
    const entity = entities.find(e => e.id === entityId);
    setFormData({
      ...formData,
      linked_entity_id: entityId,
      linked_entity_name: entity?.name || ""
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Surveys")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {surveyId ? 'Edit Survey' : 'Create Survey'}
          </h1>
          <p className="text-slate-600 mt-1">Build your survey questions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Survey Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Link To *</Label>
                <Select value={formData.linked_entity_type} onValueChange={(value) => setFormData({...formData, linked_entity_type: value, linked_entity_id: "", linked_entity_name: ""})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ICTSystem">ICT System</SelectItem>
                    <SelectItem value="ThirdPartyProvider">Third Party Provider</SelectItem>
                    <SelectItem value="Framework">Framework</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_id">Select {formData.linked_entity_type} *</Label>
                <Select value={formData.linked_entity_id} onValueChange={handleEntityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getEntityOptions().map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <div className="flex gap-2">
                {linkedEntity && (
                  <AIQuestionGenerator
                    entityType={formData.linked_entity_type}
                    entityData={linkedEntity}
                    onQuestionsGenerated={handleAIGenerate}
                  />
                )}
                <Button type="button" onClick={addQuestion} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {formData.questions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>No questions yet. Click "Add Question" to start building your survey.</p>
              </div>
            ) : (
              formData.questions.map((question, index) => (
                <Card key={question.id} className="border border-slate-200">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-slate-400 mt-2" />
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label>Question {index + 1} *</Label>
                          <Input
                            value={question.question}
                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            placeholder="Enter your question"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Question Type</Label>
                            <Select value={question.type} onValueChange={(value) => updateQuestion(index, 'type', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Short Text</SelectItem>
                                <SelectItem value="textarea">Long Text</SelectItem>
                                <SelectItem value="single_choice">Single Choice</SelectItem>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="rating">Rating (1-5)</SelectItem>
                                <SelectItem value="yes_no">Yes/No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${index}`}
                                checked={question.required}
                                onCheckedChange={(checked) => updateQuestion(index, 'required', checked)}
                              />
                              <Label htmlFor={`required-${index}`}>Required</Label>
                            </div>
                          </div>
                        </div>
                        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                          <div className="space-y-2">
                            <Label>Options (one per line)</Label>
                            <Textarea
                              value={question.options?.join('\n') || ''}
                              onChange={(e) => updateQuestion(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={4}
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl("Surveys")}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {surveyId ? 'Update Survey' : 'Create Survey'}
          </Button>
        </div>
      </form>
    </div>
  );
}