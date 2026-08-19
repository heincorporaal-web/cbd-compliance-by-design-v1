import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AIAnalysis({ survey, responses, onAnalysisComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(survey.ai_analysis || null);

  const analyzeResponses = async () => {
    if (responses.length === 0) {
      toast.error("No responses to analyze");
      return;
    }

    setAnalyzing(true);
    try {
      const responsesText = responses.map((resp, idx) => {
        const answers = survey.questions?.map((q, qIdx) => {
          const answer = resp.responses?.find(r => r.question_id === q.id);
          return `Q${qIdx + 1}: ${q.question}\nA: ${answer?.answer || answer?.answers?.join(', ') || 'No answer'}`;
        }).join('\n\n');
        
        return `Response ${idx + 1} from ${resp.respondent_name}:\n${answers}`;
      }).join('\n\n---\n\n');

      const prompt = `Analyze the following survey responses and provide insights:

Survey: ${survey.title}
Entity: ${survey.linked_entity_type} - ${survey.linked_entity_name}
Total Responses: ${responses.length}

${responsesText}

Please provide:
1. A brief summary of overall findings (2-3 sentences)
2. 3-5 key findings or patterns identified
3. Overall sentiment (positive, neutral, negative, or mixed)
4. 3-5 specific concerns or areas requiring attention
5. Any notable trends or outliers

Be specific and actionable in your analysis.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_findings: {
              type: "array",
              items: { type: "string" }
            },
            sentiment: { type: "string" },
            concerns: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const analysisData = {
        ...result,
        last_analyzed: new Date().toISOString()
      };

      setAnalysis(analysisData);
      onAnalysisComplete(analysisData);
      toast.success("Analysis completed successfully");
    } catch (error) {
      toast.error("Failed to analyze responses");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    const lower = sentiment?.toLowerCase() || '';
    if (lower.includes('positive')) return 'bg-green-100 text-green-700 border-green-200';
    if (lower.includes('negative')) return 'bg-red-100 text-red-700 border-red-200';
    if (lower.includes('mixed')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getSentimentIcon = (sentiment) => {
    const lower = sentiment?.toLowerCase() || '';
    if (lower.includes('positive')) return <CheckCircle2 className="w-4 h-4" />;
    if (lower.includes('negative')) return <AlertCircle className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Analysis
            </CardTitle>
            <Button 
              onClick={analyzeResponses} 
              disabled={analyzing || responses.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Responses
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!analysis ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No analysis yet. Click "Analyze Responses" to generate AI insights.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${getSentimentColor(analysis.sentiment)} border flex items-center gap-1`}>
                  {getSentimentIcon(analysis.sentiment)}
                  {analysis.sentiment}
                </Badge>
                {analysis.last_analyzed && (
                  <p className="text-xs text-slate-500">
                    Last analyzed: {format(new Date(analysis.last_analyzed), 'd MMM yyyy HH:mm')}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Summary</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {analysis.summary}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Key Findings
                </h4>
                <ul className="space-y-2">
                  {analysis.key_findings?.map((finding, idx) => (
                    <li key={idx} className="text-sm text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.concerns && analysis.concerns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Areas of Concern
                  </h4>
                  <ul className="space-y-2">
                    {analysis.concerns.map((concern, idx) => (
                      <li key={idx} className="text-sm text-slate-700 bg-orange-50 p-3 rounded-lg border border-orange-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}