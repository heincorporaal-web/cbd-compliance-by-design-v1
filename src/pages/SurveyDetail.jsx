import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SurveyDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const { data: survey } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => base44.entities.Survey.filter({ id: surveyId }).then(res => res[0]),
    enabled: !!surveyId,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['surveyResponses', surveyId],
    queryFn: () => base44.entities.SurveyResponse.filter({ survey_id: surveyId }),
    enabled: !!surveyId,
  });

  const [formData, setFormData] = useState({
    respondent_name: "",
    respondent_email: "",
    responses: [],
    notes: ""
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.SurveyResponse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['surveyResponses', surveyId]);
      setSubmitted(true);
      setFormData({
        respondent_name: "",
        respondent_email: "",
        responses: [],
        notes: ""
      });
    },
  });

  const handleAnswerChange = (questionId, answer, answers = null) => {
    const newResponses = [...formData.responses];
    const existingIndex = newResponses.findIndex(r => r.question_id === questionId);
    
    if (existingIndex >= 0) {
      newResponses[existingIndex] = { question_id: questionId, answer, answers };
    } else {
      newResponses.push({ question_id: questionId, answer, answers });
    }
    
    setFormData({ ...formData, responses: newResponses });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      survey_id: surveyId,
      ...formData,
      completed_date: new Date().toISOString()
    });
  };

  const getAnswer = (questionId) => {
    return formData.responses.find(r => r.question_id === questionId);
  };

  const renderQuestion = (question) => {
    const answer = getAnswer(question.id);

    switch (question.type) {
      case 'text':
        return (
          <Input
            value={answer?.answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={answer?.answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={4}
            required={question.required}
          />
        );
      
      case 'single_choice':
        return (
          <RadioGroup value={answer?.answer || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                <Label htmlFor={`${question.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${idx}`}
                  checked={answer?.answers?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentAnswers = answer?.answers || [];
                    const newAnswers = checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter(a => a !== option);
                    handleAnswerChange(question.id, newAnswers.join(', '), newAnswers);
                  }}
                />
                <Label htmlFor={`${question.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      case 'rating':
        return (
          <RadioGroup value={answer?.answer || ''} onValueChange={(value) => handleAnswerChange(question.id, value)} className="flex gap-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                <Label htmlFor={`${question.id}-${rating}`}>{rating}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'yes_no':
        return (
          <RadioGroup value={answer?.answer || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </RadioGroup>
        );
      
      default:
        return null;
    }
  };

  if (!survey) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700 border-slate-200',
      active: 'bg-green-100 text-green-700 border-green-200',
      closed: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Surveys")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-900">{survey.title}</h1>
            <Badge variant="outline" className={`${getStatusColor(survey.status)} border`}>
              {survey.status}
            </Badge>
          </div>
          {survey.description && <p className="text-slate-600">{survey.description}</p>}
          <p className="text-sm text-slate-500 mt-1">
            {survey.linked_entity_type}: {survey.linked_entity_name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="take" className="space-y-6">
        <TabsList>
          <TabsTrigger value="take">Take Survey</TabsTrigger>
          <TabsTrigger value="responses">
            Responses
            {responses.length > 0 && (
              <Badge variant="secondary" className="ml-2">{responses.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="take">
          {survey.status === 'closed' ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">This survey is closed and no longer accepting responses.</p>
              </CardContent>
            </Card>
          ) : submitted ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Survey Submitted</h3>
                <p className="text-slate-600">Thank you for completing the survey!</p>
                <Button className="mt-4" onClick={() => setSubmitted(false)}>
                  Submit Another Response
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle>Survey Questions</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="respondent_name">Your Name *</Label>
                      <Input
                        id="respondent_name"
                        value={formData.respondent_name}
                        onChange={(e) => setFormData({...formData, respondent_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="respondent_email">Your Email *</Label>
                      <Input
                        id="respondent_email"
                        type="email"
                        value={formData.respondent_email}
                        onChange={(e) => setFormData({...formData, respondent_email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6 space-y-6">
                    {survey.questions?.map((question, index) => (
                      <div key={question.id} className="space-y-3">
                        <Label className="text-base">
                          {index + 1}. {question.question}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderQuestion(question)}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Survey
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}
        </TabsContent>

        <TabsContent value="responses">
          {responses.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No responses yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <Card key={response.id} className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{response.respondent_name}</CardTitle>
                        <p className="text-sm text-slate-600">{response.respondent_email}</p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {format(new Date(response.completed_date), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {survey.questions?.map((question, index) => {
                        const answer = response.responses?.find(r => r.question_id === question.id);
                        return (
                          <div key={question.id}>
                            <p className="text-sm font-medium text-slate-700 mb-1">
                              {index + 1}. {question.question}
                            </p>
                            <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              {answer?.answer || answer?.answers?.join(', ') || 'No answer'}
                            </p>
                          </div>
                        );
                      })}
                      {response.notes && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-1">Additional Notes</p>
                          <p className="text-sm text-slate-600">{response.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}